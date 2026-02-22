import tensorflow as tf
import numpy as np
from mediapipe_model_maker import gesture_recognizer

# 1. Load the data from extract.py
X = np.load("X_data.npy").astype('float32')
y = np.load("y_data.npy")
with open("labels.txt", "r") as f:
    labels = f.read().splitlines()

# 2. Build a Landmark-Classifier Model
model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(42,)),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.1),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dense(len(labels), activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
model.fit(X, y, epochs=50, validation_split=0.2)

# 3. Export to TFLite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()
with open("gesture_recognizer.tflite", "wb") as f:
    f.write(tflite_model)

# 4. WRAP INTO .TASK FILE
# This part adds the metadata MediaPipe needs to recognize it as a "Task"
from mediapipe.tasks.python.metadata.metadata_writers import gesture_classifier_writer

writer = gesture_classifier_writer.MetadataWriter.create(
    tflite_model,
    labels=labels,
    score_threshold=0.5
)
tflite_model_with_metadata, _ = writer.populate()

with open("hand_gesture.task", "wb") as f:
    f.write(tflite_model_with_metadata)

print("Successfully created hand_gesture.task!")