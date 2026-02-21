from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

#added this to open a new tab
@app.route('/history')
def history():
    return render_template('history.html')

@app.route('/get_text', methods=['POST'])
def get_text():
    data = request.get_json()
    
    # If data is None or 'extracted_text' is missing, default to empty string
    user_string = data.get('extracted_text')

    print(f"Python received: '{user_string}'")
    
    
    return jsonify({"status": "success", "message": "DONE"})

import cv2
import numpy as np
import base64

def data_url_to_cv2(data_url):
    """
    Converts a Data URL string into an OpenCV image (numpy array).
    """
    try:
        # 1. Split the header from the actual base64 data
        # Format: "data:image/jpeg;base64,/9j/4AAQSkZJR..."
        header, base64_str = data_url.split(',', 1)

        # 2. Decode the base64 string into raw bytes
        image_bytes = base64.b64decode(base64_str)

        # 3. Convert bytes into a 1D numpy array of numbers (0-255)
        np_array = np.frombuffer(image_bytes, dtype=np.uint8)

        # 4. Reconstruct the image into a 2D/3D pixel grid (BGR color)
        image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

        return image
    except Exception as e:
        print(f"Error reconstructing image: {e}")
        return None

def analyze_frame(data_url):
    # Reconstruct it
    frame = data_url_to_cv2(data_url)
    
    if frame is None:
        return "Invalid Image"

    # Process it: Let's find the most dominant color channel
    # frame[:,:,0] is Blue, [:,:,1] is Green, [:,:,2] is Red
    b, g, r = cv2.mean(frame)[:3]
    
    if r > g and r > b:
        return "The image is mostly Red"
    elif g > r and g > b:
        return "The image is mostly Green"
    else:
        return "The image is mostly Blue"

if __name__ == '__main__':
    app.run(debug=True)