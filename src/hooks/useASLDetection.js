/**
 * useASLDetection — Core camera-to-translation hook
 *
 * Pipeline:
 *   webcam → MediaPipe Hands → 21 landmarks → Fingerpose → letter → buffer → word/sentence
 *
 * Usage (drop into any component):
 *   const { videoRef, canvasRef, currentLetter, currentWord, sentence, isLoading, clearSentence } = useASLDetection();
 *
 *   <video ref={videoRef} />   ← webcam feed
 *   <canvas ref={canvasRef} /> ← hand skeleton overlay
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Camera } from '@mediapipe/camera_utils';
import { GestureEstimator } from 'fingerpose';
import { ASL_GESTURES } from '../data/aslGestures';

// ─── Tuning constants ────────────────────────────────────────────────────────

const CONFIDENCE_THRESHOLD = 8.0;   // out of 10 — how sure fingerpose must be
const LETTER_HOLD_MS       = 1200;  // hold a gesture this long to commit it
const LETTER_COOLDOWN_MS   = 500;   // min gap between two committed letters
const WORD_GAP_MS          = 2500;  // no detection for this long = add a space

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useASLDetection() {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef  = useRef(null);

  // Gesture estimator (fingerpose)
  const estimatorRef = useRef(new GestureEstimator(ASL_GESTURES));

  // Letter buffering state (refs to avoid stale closures inside callbacks)
  const heldLetterRef     = useRef(null);   // letter currently being held
  const heldSinceRef      = useRef(null);   // timestamp when hold started
  const lastCommitTimeRef = useRef(0);      // timestamp of last committed letter
  const lastDetectTimeRef = useRef(Date.now());

  // React state — what the UI actually renders
  const [currentLetter, setCurrentLetter] = useState('');
  const [currentWord,   setCurrentWord]   = useState('');
  const [sentence,      setSentence]      = useState('');
  const [isLoading,     setIsLoading]     = useState(true);
  const [handVisible,   setHandVisible]   = useState(false);

  // Keep currentWord in a ref so we can read it inside callbacks without stale closure
  const currentWordRef = useRef('');
  useEffect(() => { currentWordRef.current = currentWord; }, [currentWord]);

  // ── Letter commit logic ───────────────────────────────────────────────────

  const commitLetter = useCallback((letter) => {
    const now = Date.now();
    if (now - lastCommitTimeRef.current < LETTER_COOLDOWN_MS) return;
    lastCommitTimeRef.current = now;
    lastDetectTimeRef.current = now;

    setCurrentLetter(letter);
    setCurrentWord(prev => prev + letter);
  }, []);

  const commitSpace = useCallback(() => {
    const word = currentWordRef.current;
    if (!word) return;
    setSentence(prev => (prev ? prev + ' ' + word : word));
    setCurrentWord('');
    setCurrentLetter('');
  }, []);

  // ── MediaPipe result handler ──────────────────────────────────────────────

  const onHandResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear and mirror-draw the video frame
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      // No hand in frame — check if word gap exceeded
      setHandVisible(false);
      setCurrentLetter('');
      heldLetterRef.current = null;
      heldSinceRef.current  = null;

      const gapMs = Date.now() - lastDetectTimeRef.current;
      if (gapMs > WORD_GAP_MS) {
        commitSpace();
        lastDetectTimeRef.current = Date.now(); // reset so we don't keep firing
      }
      return;
    }

    setHandVisible(true);
    lastDetectTimeRef.current = Date.now();

    // Draw skeleton on canvas for each detected hand
    for (const landmarks of results.multiHandLandmarks) {
      // Mirror landmarks for display (MediaPipe gives unmirrored coords)
      const mirrored = landmarks.map(lm => ({ ...lm, x: 1 - lm.x }));

      drawConnectors(ctx, mirrored, HAND_CONNECTIONS, { color: '#00FF88', lineWidth: 2 });
      drawLandmarks(ctx, mirrored, { color: '#FF3366', lineWidth: 1, radius: 3 });

      // Convert normalized MediaPipe landmarks → pixel coords for fingerpose
      const keypoints = landmarks.map(lm => [
        lm.x * canvas.width,
        lm.y * canvas.height,
        lm.z * canvas.width,
      ]);

      // Run gesture estimation
      const estimate = estimatorRef.current.estimate(keypoints, CONFIDENCE_THRESHOLD);

      if (estimate.gestures.length > 0) {
        // Pick the gesture with the highest score
        const best = estimate.gestures.reduce((a, b) => (a.score > b.score ? a : b));
        const detectedLetter = best.name;

        setCurrentLetter(detectedLetter);

        // Hold-to-commit: must hold same letter for LETTER_HOLD_MS
        if (heldLetterRef.current !== detectedLetter) {
          heldLetterRef.current = detectedLetter;
          heldSinceRef.current  = Date.now();
        } else {
          const heldMs = Date.now() - heldSinceRef.current;
          if (heldMs >= LETTER_HOLD_MS) {
            commitLetter(detectedLetter);
            heldSinceRef.current = Date.now(); // reset hold timer
          }
        }
      } else {
        heldLetterRef.current = null;
        heldSinceRef.current  = null;
        setCurrentLetter('');
      }
    }
  }, [commitLetter, commitSpace]);

  // ── MediaPipe + Camera setup ──────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Init MediaPipe Hands
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands:          1,     // one hand is enough for fingerspelling
      modelComplexity:      1,     // 0 = fast, 1 = accurate
      minDetectionConfidence: 0.7,
      minTrackingConfidence:  0.6,
    });

    hands.onResults(onHandResults);
    handsRef.current = hands;

    // Init camera
    const camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width:  640,
      height: 480,
    });

    camera.start().then(() => setIsLoading(false));
    cameraRef.current = camera;

    return () => {
      camera.stop();
      hands.close();
    };
  }, [onHandResults]);

  // ── Public API ────────────────────────────────────────────────────────────

  const clearSentence = useCallback(() => {
    setSentence('');
    setCurrentWord('');
    setCurrentLetter('');
  }, []);

  const clearWord = useCallback(() => {
    setCurrentWord('');
    setCurrentLetter('');
  }, []);

  const addSpace = useCallback(() => {
    commitSpace();
  }, [commitSpace]);

  return {
    videoRef,       // attach to <video> element
    canvasRef,      // attach to <canvas> element (shows skeleton overlay)
    currentLetter,  // single letter detected right now (e.g. "A")
    currentWord,    // letters buffered so far (e.g. "HEL")
    sentence,       // committed words (e.g. "HELLO WORLD")
    isLoading,      // true while MediaPipe model is downloading
    handVisible,    // true when a hand is in frame
    clearSentence,  // call to reset everything
    clearWord,      // call to discard current word
    addSpace,       // call to manually commit current word
  };
}
