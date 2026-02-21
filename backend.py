from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_text', methods=['POST'])
def get_text():
    data = request.get_json()
    
    # If data is None or 'extracted_text' is missing, default to empty string
    user_string = data.get('extracted_text') if data else ""
    
    if user_string is None:
        user_string = ""

    print(f"Python received: '{user_string}'")
    
    # Now .upper() will work even if string is empty
    processed_msg = f"Python successfully processed: {user_string.upper()}"
    
    return jsonify({"status": "success", "message": processed_msg})

if __name__ == '__main__':
    app.run(debug=True)