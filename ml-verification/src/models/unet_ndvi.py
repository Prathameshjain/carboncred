"""
UNet model for vegetation segmentation using NDVI images.
Input: NDVI images (256x256x1)
Output: vegetation mask (256x256x1, sigmoid)
"""
import tensorflow as tf
from tensorflow.keras import layers, Model
import tensorflow.keras.backend as K


def dice_coefficient(y_true, y_pred, smooth=1.0):
    """Compute Dice coefficient for evaluation."""
    y_true_f = K.flatten(y_true)
    y_pred_f = K.flatten(y_pred)
    intersection = K.sum(y_true_f * y_pred_f)
    return (2. * intersection + smooth) / (K.sum(y_true_f) + K.sum(y_pred_f) + smooth)


def dice_loss(y_true, y_pred):
    """Dice loss for training."""
    return 1 - dice_coefficient(y_true, y_pred)


def bce_dice_loss(y_true, y_pred):
    """Combined Binary Crossentropy and Dice loss."""
    bce = tf.keras.losses.binary_crossentropy(y_true, y_pred)
    return bce + dice_loss(y_true, y_pred)


def iou_metric(y_true, y_pred, smooth=1.0):
    """Intersection over Union metric."""
    y_true_f = K.flatten(y_true)
    y_pred_f = K.flatten(K.round(y_pred))
    intersection = K.sum(y_true_f * y_pred_f)
    union = K.sum(y_true_f) + K.sum(y_pred_f) - intersection
    return (intersection + smooth) / (union + smooth)


def conv_block(inputs, filters, kernel_size=3):
    """Convolutional block with BatchNorm and ReLU."""
    x = layers.Conv2D(filters, kernel_size, padding='same')(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.Conv2D(filters, kernel_size, padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    return x


def encoder_block(inputs, filters):
    """Encoder block: conv_block + MaxPooling."""
    x = conv_block(inputs, filters)
    p = layers.MaxPooling2D(pool_size=(2, 2))(x)
    return x, p


def decoder_block(inputs, skip, filters):
    """Decoder block: UpSampling + concat + conv_block."""
    x = layers.UpSampling2D(size=(2, 2))(inputs)
    x = layers.Concatenate()([x, skip])
    x = conv_block(x, filters)
    return x


def unet_model(input_shape=(256, 256, 1)):
    """
    Build UNet model for vegetation segmentation.
    
    Args:
        input_shape: Input image shape (height, width, channels)
    
    Returns:
        Keras Model for vegetation segmentation
    """
    inputs = layers.Input(shape=input_shape)
    
    # Encoder path
    s1, p1 = encoder_block(inputs, 32)
    s2, p2 = encoder_block(p1, 64)
    s3, p3 = encoder_block(p2, 128)
    s4, p4 = encoder_block(p3, 256)
    
    # Bridge
    b = conv_block(p4, 512)
    
    # Decoder path
    d1 = decoder_block(b, s4, 256)
    d2 = decoder_block(d1, s3, 128)
    d3 = decoder_block(d2, s2, 64)
    d4 = decoder_block(d3, s1, 32)
    
    # Output layer
    outputs = layers.Conv2D(1, 1, activation='sigmoid')(d4)
    
    model = Model(inputs, outputs, name='unet_vegetation')
    return model


def get_compiled_unet(input_shape=(256, 256, 1), learning_rate=1e-4):
    """
    Get a compiled UNet model ready for training.
    
    Args:
        input_shape: Input image shape
        learning_rate: Learning rate for Adam optimizer
    
    Returns:
        Compiled Keras Model
    """
    model = unet_model(input_shape)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss=bce_dice_loss,
        metrics=['accuracy', iou_metric, dice_coefficient]
    )
    return model
