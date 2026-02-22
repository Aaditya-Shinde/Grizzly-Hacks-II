import pandas as pd
import numpy as np
import cv2
import os
from tqdm import tqdm

# Settings
SAMPLES_PER_GESTURE = 100
OUTPUT_DIR = "static_asl_dataset"
os.makedirs(OUTPUT_DIR, exist_ok=True)

df = pd.read_csv("train.csv")
signs = df['sign'].unique()

for sign in tqdm(signs, desc="Processing Signs"):
    sign_dir = os.path.join(OUTPUT_DIR, sign)
    os.makedirs(sign_dir, exist_ok=True)
    
    # Filter sequences for this sign
    sign_df = df[df['sign'] == sign]
    
    # Take up to 100 samples, ideally from different participants
    # This helps the model generalize across different hand sizes/shapes
    samples = sign_df.sample(n=min(len(sign_df), SAMPLES_PER_GESTURE), random_state=42)
    
    for _, row in samples.iterrows():
        pq_path = row['path']
        seq_id = row['sequence_id']
        
        # Load one frame from the parquet
        pq_df = pd.read_parquet(pq_path)
        
        # Get middle frame landmarks
        frames = pq_df['frame'].unique()
        mid_frame = frames[len(frames)//2]
        frame_data = pq_df[pq_df['frame'] == mid_frame]
        
        # Extract Right Hand (or Left if Right is missing)
        hand = frame_data[frame_data['type'] == 'right_hand']
        if hand['x'].isnull().all():
            hand = frame_data[frame_data['type'] == 'left_hand']
            
        if not hand['x'].isnull().all():
            # Draw on 256x256 canvas for Model Maker
            img = np.zeros((256, 256, 3), dtype=np.uint8)
            for i in range(21): # MediaPipe 21 landmarks
                lm = hand[hand['landmark_index'] == i]
                if not lm.empty:
                    x, y = int(lm['x'].values[0] * 256), int(lm['y'].values[0] * 256)
                    cv2.circle(img, (x, y), 3, (255, 255, 255), -1)
            
            cv2.imwrite(os.path.join(sign_dir, f"{seq_id}.jpg"), img)