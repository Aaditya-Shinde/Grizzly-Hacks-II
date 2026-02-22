import pandas as pd
import numpy as np
import os
from tqdm import tqdm

# Settings
SAMPLES_PER_GESTURE = 100
df = pd.read_csv("train.csv")
signs = sorted(df['sign'].unique()) # Sorted to keep label index consistent

X = []
y = []

for label_idx, sign in enumerate(tqdm(signs, desc="Extracting Landmarks")):
    sign_df = df[df['sign'] == sign]
    samples = sign_df.sample(n=min(len(sign_df), SAMPLES_PER_GESTURE), random_state=42)
    
    for _, row in samples.iterrows():
        pq_df = pd.read_parquet(row['path'])
        mid_frame = pq_df['frame'].unique()[len(pq_df['frame'].unique())//2]
        frame_data = pq_df[pq_df['frame'] == mid_frame]
        
        hand = frame_data[frame_data['type'] == 'right_hand']
        if hand['x'].isnull().all():
            hand = frame_data[frame_data['type'] == 'left_hand']
            
        if not hand['x'].isnull().all():
            # Get 21 landmarks (x, y, z)
            landmarks = hand.sort_values('landmark_index')[['x', 'y', 'z']].values.flatten()
            if len(landmarks) == 63:
                X.append(landmarks)
                y.append(label_idx)

np.save("X_data.npy", np.array(X))
np.save("y_data.npy", np.array(y))
with open("labels.txt", "w") as f:
    f.write("\n".join(signs))