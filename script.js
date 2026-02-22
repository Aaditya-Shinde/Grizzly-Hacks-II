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

let gestureRecognizer;
let lastVideoTime = -1;

// ─── Letter / word state ──────────────────────────────────────────────────────
let currentWord  = '';
let sentence     = '';
let letterCounts = JSON.parse(localStorage.getItem('signify_letterCounts') || '{}');
let wordHistory  = JSON.parse(localStorage.getItem('signify_history')      || '[]');

let voteBuffer    = [];
let holdingLetter = null;
let holdStart     = null;
let lastCommit    = 0;
let lastHandSeen  = Date.now();

const VOTE_WINDOW    = 10;
const VOTE_THRESHOLD = 0.60;
const HOLD_MS        = 2000;
const COOLDOWN_MS    = 600;
const WORD_GAP_MS    = 3000;

// ─── ASL Geometric Classifier ─────────────────────────────────────────────────
// Uses normalized hand landmarks (21 points) to classify ASL letters.
// Works on the raw landmarks from MediaPipe — no custom model needed.
//
// MediaPipe landmark indices:
//  0=wrist  4=thumb tip  8=index tip  12=middle tip  16=ring tip  20=pinky tip
//  6=index PIP  10=middle PIP  14=ring PIP  18=pinky PIP

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

// Finger tip is extended if it's further from wrist than its PIP joint
function extended(tip, pip, threshold = 1.6) {
    return fromWrist(tip) > fromWrist(pip) * threshold;
}

// Thumb is horizontal if its x-movement dominates y-movement
function thumbHoriz(lm) {
    return Math.abs(lm[4][0] - lm[1][0]) > Math.abs(lm[4][1] - lm[1][1]);
}

function classifyASL(rawLandmarks) {
    const lm = normalizeLandmarks(rawLandmarks);

    // Finger extension flags
    const TH = extended(lm[4],  lm[3]);   // thumb
    const IX = extended(lm[8],  lm[6]);   // index
    const MD = extended(lm[12], lm[10]);  // middle
    const RN = extended(lm[16], lm[14]);  // ring
    const PK = extended(lm[20], lm[18]);  // pinky

    const thumbToIndex  = d(lm[4], lm[8]);
    const thumbToMiddle = d(lm[4], lm[12]);
    const indexToMiddle = d(lm[8], lm[12]);
    const thumbToIdxBase = d(lm[4], lm[5]);

    // ── Single finger ──────────────────────────────────────────────────────
    // I: only pinky up
    if (!TH && !IX && !MD && !RN && PK)
        return 'I';

    // D: index up, thumb near middle, others curled
    if (!TH && IX && !MD && !RN && !PK && thumbToMiddle < 0.7)
        return 'D';

    // ── Two fingers ────────────────────────────────────────────────────────
    // L: index + thumb sideways (L-shape)
    if (TH && IX && !MD && !RN && !PK && thumbHoriz(lm))
        return 'L';

    // G: index + thumb pointing sideways
    if (TH && IX && !MD && !RN && !PK && !thumbHoriz(lm)) {
        if (Math.abs(lm[8][0]) > Math.abs(lm[8][1])) return 'G';
    }

    // Y: thumb + pinky (shaka)
    if (TH && !IX && !MD && !RN && PK)
        return 'Y';

    // R: index + middle crossed (middle half-curled over index)
    if (!TH && IX && MD && !RN && !PK && indexToMiddle < 0.25)
        return 'R';

    // U: index + middle up, close together
    if (!TH && IX && MD && !RN && !PK && indexToMiddle < 0.5)
        return 'U';

    // V: index + middle up, spread apart (peace sign)
    if (!TH && IX && MD && !RN && !PK && indexToMiddle >= 0.5)
        return 'V';

    // H: index + middle pointing sideways
    if (!TH && IX && MD && !RN && !PK) {
        if (Math.abs(lm[8][0]) > Math.abs(lm[8][1])) return 'H';
        return 'U';
    }

    // ── Three fingers ──────────────────────────────────────────────────────
    // K: index + middle + thumb up
    if (TH && IX && MD && !RN && !PK)
        return 'K';

    // W: index + middle + ring up
    if (!TH && IX && MD && RN && !PK)
        return 'W';

    // ── Four fingers ───────────────────────────────────────────────────────
    // B: all four fingers up, thumb tucked
    if (!TH && IX && MD && RN && PK)
        return 'B';

    // ── Closed-fist family (A / E / M / N / S / T) ────────────────────────
    if (!IX && !MD && !RN && !PK) {
        // A: fist with thumb alongside (horizontal)
        if (TH && thumbHoriz(lm))
            return 'A';

        // T: thumb pokes between index and middle
        if (TH && thumbToIdxBase < 0.7)
            return 'T';

        // S: fist, thumb wraps over fingers
        if (TH && !thumbHoriz(lm) && thumbToIndex < 1.0)
            return 'S';

        // E: fingers curl like claw, tips near palm
        if (fromWrist(lm[8]) < 0.8)
            return 'E';

        // M / N: fingers fold over thumb
        const ixOver = lm[8][1]  > lm[4][1];
        const mdOver = lm[12][1] > lm[4][1];
        const rnOver = lm[16][1] > lm[4][1];

        if (ixOver && mdOver && rnOver) return 'M';
        if (ixOver && mdOver)           return 'N';

        return 'S'; // default closed fist
    }

    // ── F: index + thumb circle, middle/ring/pinky up ─────────────────────
    if (!TH && !IX && MD && RN && PK && thumbToIndex < 0.6)
        return 'F';

    // ── O: all fingers curved to meet thumb ───────────────────────────────
    if (!TH && !IX && !MD && !RN && !PK && thumbToIndex < 0.7)
        return 'O';

    // ── C: curved C-shape ─────────────────────────────────────────────────
    if (!TH && !IX && !MD && !RN && !PK && thumbToIndex > 0.8) {
        const avg = (fromWrist(lm[8]) + fromWrist(lm[12]) + fromWrist(lm[16]) + fromWrist(lm[20])) / 4;
        if (avg > 0.8 && avg < 1.6) return 'C';
    }

    // ── X: index finger hooked (half-curled) ──────────────────────────────
    if (!TH && !IX && !MD && !RN && !PK) {
        const idist = fromWrist(lm[8]);
        if (idist > 0.8 && idist < 1.4) return 'X';
    }

    return null;
}

// ─── MediaPipe gesture → ASL label mapping ────────────────────────────────────
// Used as fallback when the geometric classifier returns null.
const GESTURE_MAP = {
    'Thumb_Up':    'A',      // thumbs up closely resembles ASL A
    'Thumb_Down':  'A',      // downward thumb variant
    'Closed_Fist': 'S',      // closed fist = ASL S
    'Open_Palm':   'B',      // flat open hand = ASL B
    'Pointing_Up': 'D',      // index pointing up = ASL D
    'Victory':     'V',      // peace sign = ASL V
    'ILoveYou':    'ILY',    // ILY handshape (thumb + index + pinky)
};

// ─── Display helpers ──────────────────────────────────────────────────────────
function updateDisplay() {
    currentWordDisplay.textContent = currentWord || '—';
    outputText.textContent = sentence || 'Waiting for signs...';
}

function updateTopSigns() {
    const sorted = Object.entries(letterCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (sorted.length === 0) {
        topSignsList.innerHTML = '<li>Waiting for data...</li>';
        return;
    }

    topSignsList.innerHTML = sorted.map(([letter, count]) =>
        `<li style="padding: 8px 0; color: #00ccff; font-family: 'Space Mono', monospace;
                    border-bottom: 1px solid rgba(255,255,255,0.05); display: flex;
                    justify-content: space-between; align-items: center;">
            <span style="font-size: 1.1rem; font-weight: bold;">${letter}</span>
            <span style="color: #a0a4b8; font-size: 0.8rem;">${count}&times;</span>
        </li>`
    ).join('');
}

// ─── Letter commit logic ──────────────────────────────────────────────────────
function getVotedLetter(buffer) {
    if (buffer.length < 3) return null;
    const counts = {};
    for (const l of buffer) counts[l] = (counts[l] || 0) + 1;
    const [best, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return count / buffer.length >= VOTE_THRESHOLD ? best : null;
}

function commitLetter(letter) {
    const now = Date.now();
    if (now - lastCommit < COOLDOWN_MS) return;
    lastCommit    = now;
    lastHandSeen  = now;
    currentWord  += letter;
    letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    localStorage.setItem('signify_letterCounts', JSON.stringify(letterCounts));
    holdingLetter = null;
    holdStart     = null;
    updateDisplay();
    updateTopSigns();
}

function commitWord() {
    if (!currentWord) return;
    sentence = sentence ? sentence + ' ' + currentWord : currentWord;
    wordHistory.push({ word: currentWord, time: Date.now() });
    localStorage.setItem('signify_history', JSON.stringify(wordHistory));
    currentWord = '';
    updateDisplay();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function startWebcam() {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}

async function init() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "gesture_recognizer.task",
            delegate: "GPU"
        },
        runningMode: "LIVE_STREAM",
        numHands: 2
    });

    recognition.start();
    startWebcam();
}

// ─── Prediction loop ──────────────────────────────────────────────────────────
async function predictWebcam() {
    canvasElement.width  = video.videoWidth;
    canvasElement.height = video.videoHeight;

    const nowInMs = Date.now();

    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const results = gestureRecognizer.recognizeForVideo(video, nowInMs);

        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        const drawingUtils = new DrawingUtils(canvasCtx);

        if (results.landmarks && results.landmarks.length > 0) {
            lastHandSeen = nowInMs;

            // Draw skeleton
            for (const landmarks of results.landmarks) {
                drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
                    color: "#00ccff",
                    lineWidth: 3
                });
                drawingUtils.drawLandmarks(landmarks, { color: "#ffffff", lineWidth: 1 });
            }

            // 1. Try MediaPipe gesture recognizer first
            let letter = null;
            if (results.gestures.length > 0) {
                const gestureLabel = results.gestures[0][0].categoryName;
                letter = GESTURE_MAP[gestureLabel] || null;
            }

            // 2. Fall back to geometric ASL classifier for letters not in gesture map
            if (!letter && results.landmarks.length > 0) {
                const rawLandmarks = results.landmarks[0].map(lm => [lm.x, lm.y, lm.z]);
                letter = classifyASL(rawLandmarks);
            }

            if (letter) {
                voteBuffer.push(letter);
                if (voteBuffer.length > VOTE_WINDOW) voteBuffer.shift();

                const voted = getVotedLetter(voteBuffer);

                if (voted) {
                    if (holdingLetter !== voted) {
                        holdingLetter = voted;
                        holdStart     = nowInMs;
                    } else if (nowInMs - holdStart >= HOLD_MS) {
                        commitLetter(voted);
                    }
                }
            } else {
                voteBuffer    = [];
                holdingLetter = null;
                holdStart     = null;
            }

        } else {
            // No hand detected
            voteBuffer    = [];
            holdingLetter = null;
            holdStart     = null;

            if (nowInMs - lastHandSeen > WORD_GAP_MS) {
                commitWord();
                lastHandSeen = nowInMs;
            }
        }
    }

    window.requestAnimationFrame(predictWebcam);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
clearWordBtn.addEventListener('click', () => {
    currentWord   = '';
    holdingLetter = null;
    holdStart     = null;
    voteBuffer    = [];
    updateDisplay();
});

updateDisplay();
updateTopSigns();
init();
