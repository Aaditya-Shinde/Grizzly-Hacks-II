const video = document.getElementById('webcam');
const canvas = document.getElementById('cam-display');
const ctx = canvas.getContext('2d');

navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => { video.srcObject = stream; })
    .catch(err => console.error("Camera error: ", err));

async function sendToPython() {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.6);
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
sendToPython();