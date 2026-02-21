from flask import Flask, request, jsonify, render_template
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import cv2
import base64
import numpy as np

base_options = python.BaseOptions(model_asset_path='gesture_recognizer.task')
options = vision.GestureRecognizerOptions(base_options=base_options)
recognizer = vision.GestureRecognizer.create_from_options(options)

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

#added this to open a new tab
@app.route('/history')
def history():
    return render_template('history.html')


def data_url_to_cv2(data_url):
    header, encoded = data_url.split(",", 1)
    data = base64.b64decode(encoded)
    
    # Convert bytes to a numpy array
    nparr = np.frombuffer(data, np.uint8)
    
    # Decode the image array into a CV2 BGR image
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def processImg(img):
    # Convert BGR to RGB and then to MediaPipe Image object
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)

    # Run detection
    result = recognizer.recognize(mp_image)

    if result.hand_landmarks:
        h, w, _ = img.shape
        
        for hand_landmarks in result.hand_landmarks:
            # 1. Draw the Points
            for landmark in hand_landmarks:
                # Convert normalized (0-1) to pixel coordinates
                px = int(landmark.x * w)
                py = int(landmark.y * h)
                cv2.circle(img, (px, py), 5, (0, 255, 0), -1)

            # 2. Draw Connections (Simplified Example)
            # To draw lines, you'd follow the HandLandmark connections map 
            # (e.g., connect point 0 to 1, 1 to 2, 2 to 3, 3 to 4 for thumb)
            
        # 3. Draw Gesture Label
        if result.gestures:
            gesture = result.gestures[0][0].category_name
            cv2.putText(img, gesture, (50, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

    return img

@app.route('/get_text', methods=['POST'])
def get_text():
    data = request.get_json()
    
    imageData = data.get('image')

    img = data_url_to_cv2(imageData)

    overlayed = processImg(img)

    cv2.imwrite("debug_frame.jpg", overlayed)
    cv2.waitKey(0)

    print(f"Python received: '{imageData}'")
    
    
    return jsonify({"status": "success", "message": "DONE"})

if __name__ == "__main__":
    app.run(debug=True)
