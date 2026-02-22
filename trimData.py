import os
import random
import shutil

og = 'asl_alphabet'
new = 'asl_alphabet_trimmed'
samples_per_folder = 150

if not os.path.exists(new):
    os.makedirs(new)

for folder_name in os.listdir(og):
    source_folder = os.path.join(og, folder_name)
    
    if not os.path.isdir(source_folder):
        continue
        
    target_folder = os.path.join(new, folder_name)
    os.makedirs(target_folder, exist_ok=True)

    all_images = [f for f in os.listdir(source_folder) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    num_to_sample = min(len(all_images), samples_per_folder)
    sampled_images = random.sample(all_images, num_to_sample)

    for img in sampled_images:
        shutil.copy2(
            os.path.join(source_folder, img), 
            os.path.join(target_folder, img)
        )
