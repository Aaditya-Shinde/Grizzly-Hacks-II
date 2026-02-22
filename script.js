import {
    GestureRecognizer,
    FilesetResolver,
    DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("cam-display");
const canvasCtx = canvasElement.getContext("2d");

let gestureRecognizer;
let lastVideoTime = -1;


//#region init
function startWebcam(){
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}

async function init(){
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

    recognition.start();
    startWebcam();
}
//#endregion

async function predictWebcam() {
    // Sync canvas size to video size
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    let nowInMs = Date.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const results = gestureRecognizer.recognizeForVideo(video, nowInMs);

        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        const drawingUtils = new DrawingUtils(canvasCtx);

        if (results.gestures.length > 0) {
            const categoryName = results.gestures[0][0].categoryName;
            const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(2);
            const handedness = results.handednesses[0][0].displayName;

            console.log(`Gesture: ${categoryName} (${handedness}) \n Confidence: ${categoryScore}%`);

            for (const landmarks of results.landmarks) {
                drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
                    color: "#00FF00",
                    lineWidth: 5
                });
                drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 2 });
            }
        } else {
            console.log("No hand detected");
        }
    }
    window.requestAnimationFrame(predictWebcam);
}

init();