from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_text', methods=['POST'])
def get_text():
    # Receive the JSON data from JS
    data = request.get_json()
    
    # Extract the specific string
    user_string = data.get('extracted_text')
    
    # --- DO YOUR PYTHON LOGIC HERE ---
    print(f"Python received: {user_string}")
    processed_msg = f"Python successfully processed: {user_string.upper()}"
    # ---------------------------------

    # Send a response back to the browser
    return jsonify({"status": "success", "message": processed_msg})

if __name__ == '__main__':
    app.run(debug=True)