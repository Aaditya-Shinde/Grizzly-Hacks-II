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

//#region ─── MediaPipe gesture → ASL word mapping ─────────────────────────────────────
const GESTURE_MAP = {
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 
    'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 
    'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 
    'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 
    'Y': 'Y', 'Z': 'Z',
    'space': ' ', 
    'del': 'DELETE',
    'none': ''
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

    if (word == 'DELETE'){
        sentence = sentence.substring(0, sentence.length - 1);
    } else {
        lastCommit = now;
        prevWord   = word;

        console.log(word);
        sentence += word;
        wordCounts[word] = (wordCounts[word] || 0) + 1;
        localStorage.setItem('signify_wordCounts', JSON.stringify(wordCounts));
        wordHistory.push({ word, time: Date.now() });
        localStorage.setItem('signify_history', JSON.stringify(wordHistory));
    }

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
    recognition.onerror        = (e) => {
        if (e.error === 'not-allowed') {
            currentWordDisplay.textContent = 'Mic blocked';
            outputText.textContent = 'Microphone access was denied. Click the 🔒 in your address bar to allow it.';
        }
    };
    recognition.onend = () => {
        if (handlerType === 'speech') {
            setTimeout(() => {
                try { recognition.start(); } catch (_) {}
            }, 300);
        }
    };
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
        if (recognition) try { recognition.stop(); } catch (_) {}
        updateDisplay(null);
        outputText.textContent = 'Waiting for signs...';
        predictWebcam();
    });

    speechBtn.addEventListener('click', () => {
        sentence    = '';
        handlerType = 'speech';
        currentWordDisplay.textContent = '🎙 Listening...';
        outputText.textContent = 'Start speaking...';
        if (recognition) {
            try { recognition.start(); } catch (_) { /* already running is fine */ }
        }
    });

    updateDisplay(null);
    updateTopSigns();
    startAudio();

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

    startWebcam();
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

            if (word) {
                voteBuffer.push(word);
                if (voteBuffer.length > VOTE_WINDOW) voteBuffer.shift();

                const voted = getVotedWord(voteBuffer);
                if (voted) {
                    updateDisplay(voted);
                    if (holdingWord !== voted) {
                        holdingWord = voted;
                        holdStart   = nowInMs;
                    } else if (nowInMs - holdStart >= HOLD_MS) {
                        commitWord(voted);
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

function predictSpeech(event) {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            sentence += event.results[i][0].transcript + ' ';
        } else {
            interimTranscript += event.results[i][0].transcript;
        }
    }
    currentWordDisplay.textContent = 'Listening...';
    outputText.textContent = (sentence + interimTranscript) || 'Listening...';
}
//#endregion

init();