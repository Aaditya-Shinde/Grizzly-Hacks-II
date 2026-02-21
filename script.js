async function sendToPython() {
    // 1. Extract the text from the HTML element
    const textValue = document.getElementById('test').value;

    // 2. Send it to Python using fetch
    const response = await fetch('/get_text', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "extracted_text": textValue })
    });

    // 3. Get the answer back from Python
    console.log("waiting")
    const data = await response.json();
    
    // Update the page with Python's response
    document.getElementById('pyRes').innerText = data.message;
}

sendToPython();