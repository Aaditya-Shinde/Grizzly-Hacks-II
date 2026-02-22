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
const signBtn            = document.getElementById("sign-to-text-btn");
const speechBtn          = document.getElementById("speech-to-text-btn");

let gestureRecognizer;
let recognition;
let requestId;
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

// FIX 1: default to 'sign' so the webcam loop starts immediately on load
var handlerType = 'sign';

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
function classifyWord(rawLandmarks) {
    const lm = normalizeLandmarks(rawLandmarks);

    const TH = extended(lm[4],  lm[3]);
    const IX = extended(lm[8],  lm[6]);
    const MD = extended(lm[12], lm[10]);
    const RN = extended(lm[16], lm[14]);
    const PK = extended(lm[20], lm[18]);

    const thumbToIndex   = d(lm[4], lm[8]);
    const thumbToMiddle  = d(lm[4], lm[12]);
    const indexToMiddle  = d(lm[8], lm[12]);
    const thumbToIdxBase = d(lm[4], lm[5]);

    if (!TH && IX && MD && RN && PK) {
        if (thumbToIndex < 0.5) return 'please';
        return 'hello';
    }
    if (!TH && IX && MD && RN && !PK) return 'water';
    if (!TH && IX && MD && !RN && !PK) {
        if (indexToMiddle < 0.25) return 'see';
        if (indexToMiddle >= 0.5) return 'no';
        return 'look';
    }
    if (!TH && IX && !MD && !RN && PK) return 'callonphone';
    if (TH && !IX && !MD && !RN && PK) return 'callonphone';
    if (TH && IX && !MD && !RN && PK) return 'yes';
    if (!TH && IX && !MD && !RN && !PK) return 'up';
    if (!TH && !IX && !MD && !RN && PK) return 'quiet';
    if (TH && IX && MD && !RN && !PK) return 'drink';
    if (TH && IX && !MD && !RN && !PK) {
        if (thumbHoriz(lm)) return 'like';
        return 'find';
    }
    if (TH && IX && MD && RN && PK) return 'open';
    if (!TH && !IX && MD && RN && PK && thumbToIndex < 0.6) return 'fine';
    if (!IX && !MD && !RN && !PK) {
        if (!TH) {
            const ixOver = lm[8][1]  > lm[4][1];
            const mdOver = lm[12][1] > lm[4][1];
            if (ixOver && mdOver) return 'period';
            if (fromWrist(lm[8]) < 0.8) return 'no';
            return 'period';
        }
        if (thumbHoriz(lm)) return 'yes';
        if (thumbToIdxBase < 0.7) return 'think';
        if (thumbToIndex < 1.0) return 'yes';
        return 'yes';
    }
    return null;
}
//#endregion

//#region ─── MediaPipe gesture → ASL word mapping ─────────────────────────────────────
const GESTURE_MAP = {
    'Thumb_Up':    'yes',
    'Thumb_Down':  'no',
    'Closed_Fist': 'period',
    'Open_Palm':   'hello',
    'Pointing_Up': 'up',
    'Victory':     'no',
    'ILoveYou':    'I love you',
};

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
    if (now - lastCommit < COOLDOWN_MS || word == prevWord) return;

    lastCommit = now;
    prevWord   = word;

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
        // FIX 2: always kick off the webcam prediction loop directly,
        // regardless of handlerType
        video.addEventListener("loadeddata", predictWebcam);
    });
}

function startAudio() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("Web Speech API not supported in this browser.");
        return;
    }
    recognition = new SpeechRecognition();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = 'en-US';
    recognition.onresult       = predictSpeech;
}

async function init() {
    clearWordBtn.addEventListener('click', () => {
        sentence    = '';
        holdingWord = null;
        holdStart   = null;
        voteBuffer  = [];
        updateDisplay(null);
        outputText.textContent = 'Waiting for signs...';
    });

    signBtn.addEventListener('click', () => {
        sentence    = '';
        handlerType = 'sign';
        // Stop mic, restart webcam loop in case it stalled
        if (recognition) recognition.stop();
        predictWebcam();
    });

    speechBtn.addEventListener('click', () => {
        handlerType = 'speech';
        if (recognition) recognition.start();
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
    // FIX 3: do NOT auto-start recognition — default mode is sign, not speech
}
//#endregion

//#region ─── Prediction loop ──────────────────────────────────────────────────────────
async function predictWebcam() {
    // FIX 4: guard against running when in speech mode, but don't kill the
    // loop permanently — reschedule so switching back to sign works instantly
    if (!cameraRunning) return;
    if (handlerType !== 'sign') {
        window.requestAnimationFrame(predictWebcam);
        return;
    }

    canvasElement.width  = video.videoWidth;
    canvasElement.height = video.videoHeight;

    const nowInMs = Date.now();

    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const results = gestureRecognizer.recognizeForVideo(video, nowInMs);

        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        const drawingUtils = new DrawingUtils(canvasCtx);

        if (results.landmarks && results.landmarks.length > 0) {
            for (const landmarks of results.landmarks) {
                drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
                    color: "#00ccff",
                    lineWidth: 3
                });
                drawingUtils.drawLandmarks(landmarks, { color: "#ffffff", lineWidth: 1 });
            }

            let word = null;
            if (results.gestures.length > 0) {
                const gestureLabel = results.gestures[0][0].categoryName;
                word = GESTURE_MAP[gestureLabel] || null;
            }

            if (!word && results.landmarks.length > 0) {
                const rawLandmarks = results.landmarks[0].map(lm => [lm.x, lm.y, lm.z]);
                word = classifyWord(rawLandmarks);
            }

            if (word) {
                voteBuffer.push(word);
                if (voteBuffer.length > VOTE_WINDOW) voteBuffer.shift();

                const voted = getVotedWord(voteBuffer);
                if (voted) {
                    if (voted === "period") {
                        updateDisplay("period");
                        commitWord(".");
                    } else {
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
            voteBuffer  = [];
            holdingWord = null;
            holdStart   = null;
            updateDisplay(null);
        }
    }

    window.requestAnimationFrame(predictWebcam);
}

async function predictSpeech(event) {
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
//#endregion

init();