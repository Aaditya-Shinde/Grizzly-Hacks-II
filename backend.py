from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_text', methods=['POST'])
def get_text():
    data = request.get_json()
    
    user_string = data.get('image')

    print(f"Python received: '{user_string}'")
    
    
    return jsonify({"status": "success", "message": "DONE"})

if __name__ == '__main__':
    app.run(debug=True)