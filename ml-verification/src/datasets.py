"""
Dataset loaders for CarbonCred ML verification pipeline.
Supports vegetation segmentation and solar classification datasets.
"""
import tensorflow as tf
import pandas as pd
import numpy as np
from pathlib import Path
import os

AUTOTUNE = tf.data.AUTOTUNE
IMG_SIZE = (256, 256)
SEED = 42


def get_base_path():
    """Get the base path for synthetic data relative to src/."""
    src_dir = Path(__file__).parent
    return src_dir.parent / "synthetic_data"


def load_ndvi_image(path):
    """Load and preprocess NDVI image (grayscale, single channel)."""
    img = tf.io.read_file(path)
    img = tf.image.decode_png(img, channels=1)
    img = tf.image.resize(img, IMG_SIZE)
    img = tf.cast(img, tf.float32) / 255.0
    return img


def load_rgb_image(path):
    """Load and preprocess RGB image."""
    img = tf.io.read_file(path)
    img = tf.image.decode_png(img, channels=3)
    img = tf.image.resize(img, IMG_SIZE)
    img = tf.cast(img, tf.float32) / 255.0
    return img


def load_mask(path):
    """Load and preprocess binary mask."""
    img = tf.io.read_file(path)
    img = tf.image.decode_png(img, channels=1)
    img = tf.image.resize(img, IMG_SIZE)
    img = tf.cast(img, tf.float32) / 255.0
    return img


def get_vegetation_dataset(manifest_path, batch_size=8, validation_split=0.2, subset='train'):
    """
    Create vegetation segmentation dataset from manifest.
    Uses NDVI images as input and vegetation masks as target.
    
    Args:
        manifest_path: Path to dataset_manifest.csv
        batch_size: Batch size
        validation_split: Fraction for validation
        subset: 'train' or 'val'
    
    Returns:
        tf.data.Dataset with (ndvi_image, mask) pairs
    """
    df = pd.read_csv(manifest_path)
    veg_df = df[df['project_type'] == 'vegetation'].reset_index(drop=True)
    
    base_path = get_base_path()
    ndvi_dir = base_path / "ndvi"
    
    ndvi_paths = []
    mask_paths = []
    ndvi_values_list = []
    
    for _, row in veg_df.iterrows():
        sample_id = row['sample_id']
        mask_path = row['mask_path']
        image_paths = row['image_paths'].split('|')
        ndvi_vals = list(map(float, row['ndvi_values'].split('|')))
        
        veg_num = sample_id.replace('V', '')
        
        for idx in range(len(image_paths)):
            ndvi_filename = f"veg_{veg_num}_{idx}_ndvi.png"
            ndvi_path = str(ndvi_dir / ndvi_filename)
            
            if os.path.exists(ndvi_path) and os.path.exists(mask_path):
                ndvi_paths.append(ndvi_path)
                mask_paths.append(mask_path)
                ndvi_values_list.append(ndvi_vals[idx] if idx < len(ndvi_vals) else ndvi_vals[-1])
    
    total_samples = len(ndvi_paths)
    split_idx = int(total_samples * (1 - validation_split))
    
    np.random.seed(SEED)
    indices = np.random.permutation(total_samples)
    
    if subset == 'train':
        selected_indices = indices[:split_idx]
    else:
        selected_indices = indices[split_idx:]
    
    selected_ndvi = [ndvi_paths[i] for i in selected_indices]
    selected_masks = [mask_paths[i] for i in selected_indices]
    
    def load_pair(ndvi_path, mask_path):
        ndvi = load_ndvi_image(ndvi_path)
        mask = load_mask(mask_path)
        return ndvi, mask
    
    dataset = tf.data.Dataset.from_tensor_slices((selected_ndvi, selected_masks))
    
    if subset == 'train':
        dataset = dataset.shuffle(buffer_size=len(selected_ndvi), seed=SEED)
    
    dataset = dataset.map(
        lambda x, y: tf.py_function(load_pair, [x, y], [tf.float32, tf.float32]),
        num_parallel_calls=AUTOTUNE
    )
    
    dataset = dataset.map(
        lambda x, y: (tf.ensure_shape(x, [256, 256, 1]), tf.ensure_shape(y, [256, 256, 1])),
        num_parallel_calls=AUTOTUNE
    )
    
    dataset = dataset.batch(batch_size).prefetch(AUTOTUNE)
    
    return dataset


def get_solar_dataset(manifest_path, batch_size=8, validation_split=0.2, subset='train'):
    """
    Create solar classification dataset from manifest.
    Uses RGB images as input and solar labels as target.
    
    Args:
        manifest_path: Path to dataset_manifest.csv
        batch_size: Batch size
        validation_split: Fraction for validation
        subset: 'train' or 'val'
    
    Returns:
        tf.data.Dataset with (rgb_image, label) pairs
    """
    df = pd.read_csv(manifest_path)
    solar_df = df[df['project_type'] == 'solar'].reset_index(drop=True)
    
    label_map = {'no_site': 0, 'construction': 1, 'active_solar': 2}
    
    image_paths = []
    labels = []
    
    for _, row in solar_df.iterrows():
        paths = row['image_paths'].split('|')
        label = label_map.get(row['label'], 0)
        
        for path in paths:
            if os.path.exists(path):
                image_paths.append(path)
                labels.append(label)
    
    total_samples = len(image_paths)
    split_idx = int(total_samples * (1 - validation_split))
    
    np.random.seed(SEED)
    indices = np.random.permutation(total_samples)
    
    if subset == 'train':
        selected_indices = indices[:split_idx]
    else:
        selected_indices = indices[split_idx:]
    
    selected_images = [image_paths[i] for i in selected_indices]
    selected_labels = [labels[i] for i in selected_indices]
    
    def load_image_label(img_path, label):
        img = load_rgb_image(img_path)
        return img, label
    
    dataset = tf.data.Dataset.from_tensor_slices((selected_images, selected_labels))
    
    if subset == 'train':
        dataset = dataset.shuffle(buffer_size=len(selected_images), seed=SEED)
    
    dataset = dataset.map(
        lambda x, y: tf.py_function(load_image_label, [x, y], [tf.float32, tf.int32]),
        num_parallel_calls=AUTOTUNE
    )
    
    dataset = dataset.map(
        lambda x, y: (tf.ensure_shape(x, [256, 256, 3]), tf.ensure_shape(y, [])),
        num_parallel_calls=AUTOTUNE
    )
    
    dataset = dataset.batch(batch_size).prefetch(AUTOTUNE)
    
    return dataset


def get_vegetation_consistency_data(manifest_path):
    """
    Get vegetation data for consistency checking across time frames.
    
    Args:
        manifest_path: Path to dataset_manifest.csv
    
    Returns:
        List of dicts with sample_id, ndvi_values, timestamps, label
    """
    df = pd.read_csv(manifest_path)
    veg_df = df[df['project_type'] == 'vegetation'].reset_index(drop=True)
    
    consistency_data = []
    
    for _, row in veg_df.iterrows():
        ndvi_vals = list(map(float, row['ndvi_values'].split('|')))
        timestamps = row['timestamp_paths'].split('|')
        
        consistency_data.append({
            'sample_id': row['sample_id'],
            'ndvi_values': ndvi_vals,
            'timestamps': timestamps,
            'label': row['label'],
            'mask_path': row['mask_path']
        })
    
    return consistency_data


def get_dataset(manifest_path, batch_size=8):
    """
    Legacy function for backward compatibility.
    Returns both vegetation and solar datasets.
    """
    veg_train = get_vegetation_dataset(manifest_path, batch_size, subset='train')
    solar_train = get_solar_dataset(manifest_path, batch_size, subset='train')
    return veg_train, solar_train
