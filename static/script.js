const inputElement = document.getElementById('test');

async function sendToPython() {
    // 1. Grab the element
    
    // 2. LOG IT to see if it's actually finding the text
    console.log("Input Element found:", inputElement);
    const textValue = inputElement.innerHTML ? inputElement.innerHTML : "ELEMENT NOT FOUND";
    console.log("Value being sent:", textValue);

    const response = await fetch('/get_text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "extracted_text": textValue })
    });

    if (response.ok) {
        const data = await response.json();
        document.getElementById('pyRes').innerText = data.message;
    } else {
        console.error("Server returned an error:", response.status);
    }
}