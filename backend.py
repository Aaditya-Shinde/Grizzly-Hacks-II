from flask import Flask, request, jsonify, render_template
import cv2
import base64
import numpy as np

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

#added this to open a new tab
@app.route('/history')
def history():
    return render_template('history.html')

import cv2
import numpy as np
import base64

def data_url_to_cv2(data_url):
    header, encoded = data_url.split(",", 1)
    data = base64.b64decode(encoded)
    
    # Convert bytes to a numpy array
    nparr = np.frombuffer(data, np.uint8)
    
    # Decode the image array into a CV2 BGR image
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

@app.route('/get_text', methods=['POST'])
def get_text():
    data = request.get_json()
    
    imageData = data.get('image')

    frame = data_url_to_cv2(imageData)
    cv2.imwrite("debug_frame.jpg", frame)
    cv2.waitKey(0)

    print(f"Python received: '{user_string}'")
    
    
    return jsonify({"status": "success", "message": "DONE"})

if __name__ == '__main__':
    app.run(debug=True)