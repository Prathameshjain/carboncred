# quick_check.py
import pandas as pd
from PIL import Image
import matplotlib.pyplot as plt

df = pd.read_csv("../synthetic_data/dataset_manifest.csv")
row = df[df.project_type=="vegetation"].iloc[0]

imgs = row.image_paths.split("|")
mask = Image.open(row.mask_path)

plt.figure(figsize=(10,4))
for i,p in enumerate(imgs[:3]):
    plt.subplot(1,4,i+1)
    plt.imshow(Image.open(p))
    plt.axis("off")

plt.subplot(1,4,4)
plt.imshow(mask, cmap="gray")
plt.title("Mask")
plt.axis("off")
plt.show()
