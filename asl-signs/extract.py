import pandas as pd
import numpy as np
from tqdm import tqdm
import os

# Settings
SAMPLES_NEEDED = 100
df = pd.read_csv("train.csv")
# Crucial: Sorting ensures label 0 is always the same sign
signs = sorted(df['sign'].unique())

X = []
y = []

for label_idx, sign in enumerate(tqdm(signs, desc="Extracting Landmarks")):
    sign_df = df[df['sign'] == sign]
    # Shuffle available paths for variety
    available_paths = sign_df['path'].sample(frac=1, random_state=42).tolist()
    
    count = 0
    for path in available_paths:
        if count >= SAMPLES_NEEDED:
            break
            
        if not os.path.exists(path):
            continue

        pq_df = pd.read_parquet(path, columns=['frame', 'type', 'landmark_index', 'x', 'y'])
        
        unique_frames = pq_df['frame'].unique()
        mid_idx = len(unique_frames) // 2
        
        # Check middle frame first, then others
        check_frames = [unique_frames[mid_idx]] + list(unique_frames) 
        
        for frame in check_frames:
            frame_data = pq_df[pq_df['frame'] == frame]
            
            # Prioritize Right Hand, fallback to Left
            hand = frame_data[frame_data['type'] == 'right_hand']
            if hand['x'].isnull().all():
                hand = frame_data[frame_data['type'] == 'left_hand']
            
            if not hand['x'].isnull().all():
                landmarks_raw = hand.sort_values('landmark_index')[['x', 'y']].values
                
                if len(landmarks_raw) == 21:
                    # Flatten to 42 features (x0, y0, x1, y1...)
                    landmarks = landmarks_raw.flatten()
                    X.append(landmarks)
                    y.append(label_idx)
                    count += 1
                    break 
    
    if count < SAMPLES_NEEDED:
        print(f"Warning: Only found {count} valid samples for sign: {sign}")

# Save the numerical data
np.save("X_data.npy", np.array(X))
np.save("y_data.npy", np.array(y))

# Save the labels.txt file for main.py and the .task metadata
with open("labels.txt", "w") as f:
    for sign in signs:
        f.write(f"{sign}\n")

print(f"\nExtraction complete. Saved {len(X)} samples across {len(signs)} classes.")