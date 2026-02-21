const video = document.getElementById('webcam');
const canvas = document.getElementById('cam-display');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
const rect = canvas.getBoundingClientRect();

canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);

document.getElementById('start-btn').addEventListener('click', () => {startCamera();});

function startCamera() {
    navigator.mediaDevices.getUserMedia({video:true})
        .then(stream => {
            video.srcObject = stream;
            video.addEventListener('loadedmetadata', () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            });

            console.log("Camera successfully started.");
            document.getElementById('start-btn').innerText = "Camera Active";
            document.getElementById('start-btn').style.backgroundColor = "#28a745"
        })
        .catch(err => console.error("Camera error: ", err));
}

async function getData(){
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    var imageData = canvas.toDataURL('image/jpeg', 1);
    return imageData;
}

async function sendToPython() {
    var imageData = await getData();
    console.log("Value being sent:", imageData);

    const response = await fetch('/get_text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "image": imageData })
    });

    if (response.ok) {
        const data = await response.json();
        document.getElementById('pyRes').innerText = data.message;
    } else {
        console.error("Server returned an error:", response.status);
    }
}

// setInterval(sendToPython, 100);