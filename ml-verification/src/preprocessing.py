import tensorflow as tf
import numpy as np

def normalize_frames(frames):
    return frames / 255.0

def augment_veg(frames, mask):
    # random flip & rotation
    if tf.random.uniform(()) > 0.5:
        frames = tf.image.flip_left_right(frames)
        mask = tf.image.flip_left_right(mask)
    if tf.random.uniform(()) > 0.5:
        frames = tf.image.flip_up_down(frames)
        mask = tf.image.flip_up_down(mask)
    return frames, mask
