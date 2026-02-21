const video = document.getElementById('webcam');
const canvas = document.getElementById('snapshot');
const ctx = canvas.getContext('2d');

function startCamera() {
    navigator.mediaDevices.getUserMedia({video:true})
        .then(stream => {
            video.srcObject = stream;
            console.log("Camera successfully started.");
            document.getElementById('start-btn').innerText = "Camera Active";
            document.getElementById('start-btn').style.backgroundColor = "#28a745"
        })
        .catch(err => console.error("Camera error: ", err));
}

document.getElementById('start-btn').addEventListener('click', () => {startCamera();});

async function sendToPython() {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.6);
    console.log("Value being sent:", imageData);

    const response = await fetch('/get_text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "extracted_text": imageData })
    });

    if (response.ok) {
        const data = await response.json();
        document.getElementById('pyRes').innerText = data.message;
    } else {
        console.error("Server returned an error:", response.status);
    }
}