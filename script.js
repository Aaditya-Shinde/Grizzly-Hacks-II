import {
    GestureRecognizer,
    FilesetResolver,
    DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const video              = document.getElementById("webcam");
const canvasElement      = document.getElementById("cam-display");
const canvasCtx          = canvasElement.getContext("2d");
const outputText         = document.getElementById("output-text");
const topSignsList       = document.getElementById("top-signs-list");
const currentWordDisplay = document.getElementById("current-word-display");
const clearWordBtn       = document.getElementById("clear-word-btn");
const signBtn       = document.getElementById("sign-to-text-btn");
const speechBtn       = document.getElementById("speech-to-text-btn");

let gestureRecognizer;
let SpeechRecognition;
let recognition;
let lastVideoTime = -1;
let cameraRunning = false;

// ─── Word / sentence state ────────────────────────────────────────────────────
let sentence     = '';
let wordCounts   = JSON.parse(localStorage.getItem('signify_wordCounts') || '{}');
let wordHistory  = JSON.parse(localStorage.getItem('signify_history')    || '[]');

let voteBuffer   = [];
var holdingWord;
var holdStart;
var lastCommit = 0;
var prevWord = "";
var handlerType = 'speech';

const VOTE_WINDOW    = 10;
const VOTE_THRESHOLD = 0.60;
const HOLD_MS        = 500;
const COOLDOWN_MS    = 800;

//#region ─── Landmark geometry helpers ────────────────────────────────────────────────
function normalizeLandmarks(raw) {
    const wx = raw[0][0], wy = raw[0][1], wz = raw[0][2];
    const translated = raw.map(p => [p[0] - wx, p[1] - wy, p[2] - wz]);
    const m = translated[9];
    const scale = Math.hypot(m[0], m[1], m[2]) || 1;
    return translated.map(p => [p[0] / scale, p[1] / scale, p[2] / scale]);
}

function d(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function fromWrist(p) {
    return Math.hypot(p[0], p[1], p[2]);
}

function extended(tip, pip, threshold = 1.2) {
    return fromWrist(tip) > fromWrist(pip) * threshold;
}

function thumbHoriz(lm) {
    return Math.abs(lm[4][0] - lm[1][0]) > Math.abs(lm[4][1] - lm[1][1]);
}
//#endregion

//#region ─── ASL Word Classifier ──────────────────────────────────────────────────────
// Maps hand landmark geometry to words from the downloaded ASL Signs dataset.
// Covers signs with recognisable static handshapes; motion-based signs return null.
function classifyWord(rawLandmarks) {
    const lm = normalizeLandmarks(rawLandmarks);

    const TH = extended(lm[4],  lm[3]);   // thumb
    const IX = extended(lm[8],  lm[6]);   // index
    const MD = extended(lm[12], lm[10]);  // middle
    const RN = extended(lm[16], lm[14]);  // ring
    const PK = extended(lm[20], lm[18]);  // pinky

    const thumbToIndex   = d(lm[4], lm[8]);
    const thumbToMiddle  = d(lm[4], lm[12]);
    const indexToMiddle  = d(lm[8], lm[12]);
    const thumbToIdxBase = d(lm[4], lm[5]);

    // ── All four fingers, open flat (B shape) ──────────────────────────────
    // hello, bye, please, stop, thankyou all use a flat open B hand
    if (!TH && IX && MD && RN && PK) {
        if (thumbToIndex < 0.5) return 'please';    // thumb tucked = please
        return 'hello';                             // open flat = hello / bye
    }

    // ── Three middle fingers (W shape) → water ────────────────────────────
    if (!TH && IX && MD && RN && !PK) return 'water';

    // ── Two fingers (index + middle) ──────────────────────────────────────
    if (!TH && IX && MD && !RN && !PK) {
        if (indexToMiddle < 0.25) return 'see';    // crossed = see (V at eyes)
        if (indexToMiddle >= 0.5) return 'no';     // spread apart = no
        return 'look';                             // together = look
    }

    // ── Index + pinky (claw, no middle/ring) ──────────────────────────────
    if (!TH && IX && !MD && !RN && PK) return 'callonphone';

    // ── Thumb + pinky (Y / shaka shape) → callonphone ─────────────────────
    if (TH && !IX && !MD && !RN && PK) return 'callonphone';

    // ── ILY (thumb + index + pinky) → I love you ─────────────────────────
    if (TH && IX && !MD && !RN && PK) return 'yes';  // closest static match

    // ── Only index up → up ───────────────────────────────────────────────
    if (!TH && IX && !MD && !RN && !PK) return 'up';

    // ── Only pinky up → quiet ─────────────────────────────────────────────
    if (!TH && !IX && !MD && !RN && PK) return 'quiet';

    // ── Thumb + index + middle (3 on one side) → drink ───────────────────
    if (TH && IX && MD && !RN && !PK) return 'drink';

    // ── Thumb + index (L shape) → like / look ────────────────────────────
    if (TH && IX && !MD && !RN && !PK) {
        if (thumbHoriz(lm)) return 'like';          // L-shape = like
        return 'find';
    }

    // ── All five extended → open ──────────────────────────────────────────
    if (TH && IX && MD && RN && PK) return 'open';

    // ── F shape (middle+ring+pinky up, index+thumb circle) ───────────────
    if (!TH && !IX && MD && RN && PK && thumbToIndex < 0.6) return 'fine';

    // ── Closed fist family ────────────────────────────────────────────────
    if (!IX && !MD && !RN && !PK) {
        if (!TH) {
            // Pure closed fist (no fingers or thumb extended)
            const ixOver = lm[8][1]  > lm[4][1];
            const mdOver = lm[12][1] > lm[4][1];
            if (ixOver && mdOver) return 'period';    // M/N wrap = period/done
            if (fromWrist(lm[8]) < 0.8) return 'no'; // fingers very curled = no
            return 'period';
        }
        // Thumb out
        if (thumbHoriz(lm)) return 'yes';            // A-shape with thumb = yes
        if (thumbToIdxBase < 0.7) return 'think';    // thumb between fingers = think
        if (thumbToIndex < 1.0) return 'yes';        // thumb wrapped = yes
        return 'yes';
    }

    return null;
}

//#endregion

//#region ─── MediaPipe gesture → ASL word mapping ─────────────────────────────────────
// Primary classifier — runs before geometric fallback.
const GESTURE_MAP = {
    'Thumb_Up':    'yes',     // thumbs up ≈ yes
    'Thumb_Down':  'no',      // thumbs down ≈ no
    'Closed_Fist': 'period',  // closed fist ≈ period / done
    'Open_Palm':   'hello',   // open palm ≈ hello
    'Pointing_Up': 'up',      // index up ≈ up
    'Victory':     'no',      // V-shape ≈ no (two-finger wag)
    'ILoveYou':    'I love you',     // ILY shape
};

// ─── Display helpers ──────────────────────────────────────────────────────────
function updateDisplay(detected) {
    currentWordDisplay.textContent = detected || '—';
    outputText.textContent = sentence || 'Waiting for signs...';
}

function updateTopSigns() {
    const sorted = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (sorted.length === 0) {
        topSignsList.innerHTML = '<li>Waiting for data...</li>';
        return;
    }

    topSignsList.innerHTML = sorted.map(([word, count]) =>
        `<li style="padding: 8px 0; color: #00ccff; font-family: 'Space Mono', monospace;
                    border-bottom: 1px solid rgba(255,255,255,0.05); display: flex;
                    justify-content: space-between; align-items: center;">
            <span style="font-size: 1.1rem; font-weight: bold;">${word}</span>
            <span style="color: #a0a4b8; font-size: 0.8rem;">${count}&times;</span>
        </li>`
    ).join('');
}
//#endregion

//#region ─── Word commit logic ────────────────────────────────────────────────────────
function getVotedWord(buffer) {
    if (buffer.length < 3) return null;
    const counts = {};
    for (const w of buffer) counts[w] = (counts[w] || 0) + 1;
    const [best, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return count / buffer.length >= VOTE_THRESHOLD ? best : null;
}

function commitWord(word) {
    const now = Date.now();
    if (now - lastCommit < COOLDOWN_MS 
        || word == prevWord){ 
        return;
    }

    lastCommit   = now;
    prevWord = word;

    sentence += (sentence && word != '.') ? ' ' + word : word;
    wordCounts[word] = (wordCounts[word] || 0) + 1;
    localStorage.setItem('signify_wordCounts', JSON.stringify(wordCounts));
    wordHistory.push({ word, time: Date.now() });
    localStorage.setItem('signify_history', JSON.stringify(wordHistory));
    holdingWord = null;
    holdStart   = null;
    updateDisplay(null);
    updateTopSigns();
}

//#endregion

//#region ─── Init ─────────────────────────────────────────────────────────────────────
function startWebcam() {
    cameraRunning = true;
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", handler);
    });
}

function startAudio(){
    let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        document.getElementById('output').innerText = "Sorry, your browser does not support the Web Speech API. Try Chrome.";
    } else {
        recognition = new SpeechRecognition();
        
        // Configuration
        recognition.continuous = true; // Keep listening even if user pauses
        recognition.interimResults = true; // Show results as you speak
        recognition.lang = 'en-US';

        recognition.onresult = handler;
    }
}

async function init() {
    clearWordBtn.addEventListener('click', () => {
        sentence      = '';
        holdingWord   = null;
        holdStart     = null;
        voteBuffer    = [];
        updateDisplay(null);
        outputText.textContent = 'Waiting for signs...';
    });

    signBtn.addEventListener('click', () => {
        sentence = '';
        handlerType = 'sign';
        console.log(handlerType);
        recognition.stop();
    });

    speechBtn.addEventListener('click', () => {
        handlerType = 'speech';
        console.log(handlerType);
        recognition.start();
    });


    updateDisplay(null);
    updateTopSigns();

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
        },
        runningMode: "LIVE_STREAM",
        numHands: 2
    });
    
    startAudio();
    startWebcam();
    recognition.start();
}
//#endregion

//#region ─── Prediction loop ──────────────────────────────────────────────────────────
async function predictWebcam() {
    if (!cameraRunning || handlerType != 'sign') return;

    canvasElement.width  = video.videoWidth;
    canvasElement.height = video.videoHeight;

    const nowInMs = Date.now();

    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const results = gestureRecognizer.recognizeForVideo(video, nowInMs);

        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        const drawingUtils = new DrawingUtils(canvasCtx);

        if (results.landmarks && results.landmarks.length > 0) {

            // Draw skeleton
            for (const landmarks of results.landmarks) {
                drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
                    color: "#00ccff",
                    lineWidth: 3
                });
                drawingUtils.drawLandmarks(landmarks, { color: "#ffffff", lineWidth: 1 });
            }

            // 1. MediaPipe gesture recognizer (primary)
            let word = null;
            if (results.gestures.length > 0) {
                const gestureLabel = results.gestures[0][0].categoryName;
                word = GESTURE_MAP[gestureLabel] || null;
            }

            // 2. Geometric word classifier (fallback)
            if (!word && results.landmarks.length > 0) {
                const rawLandmarks = results.landmarks[0].map(lm => [lm.x, lm.y, lm.z]);
                word = classifyWord(rawLandmarks);
            }

            if (word) {
                voteBuffer.push(word);
                if (voteBuffer.length > VOTE_WINDOW) voteBuffer.shift();

                const voted = getVotedWord(voteBuffer);

                if (voted) {
                    if (voted == "period"){
                        updateDisplay("period");
                        commitWord(".");
                    } else {
                        // Show currently detected word while holding
                        updateDisplay(voted);
    
                        if (holdingWord !== voted) {
                            holdingWord = voted;
                            holdStart   = nowInMs;
                        } else if (nowInMs - holdStart >= HOLD_MS) {
                            commitWord(voted);
                        }
                    }
                }
            } else {
                voteBuffer  = [];
                holdingWord = null;
                holdStart   = null;
                updateDisplay(null);
            }

        } else {
            // No hand detected
            voteBuffer  = [];
            holdingWord = null;
            holdStart   = null;
            updateDisplay(null);
        }
    }
    window.requestAnimationFrame(predictWebcam);
}

async function predictSpeech(event){
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            sentence += '.';
        } else {
            interimTranscript += event.results[i][0].transcript;
            sentence = interimTranscript;
        }
    }
    
    updateDisplay("Speech Detection");
}

async function handler(event){
    console.log(handlerType);
    if (handlerType == 'speech'){

        predictSpeech(event);
    } else if (handlerType == 'sign'){

        predictWebcam();
    }
}

//#endregion

init();
