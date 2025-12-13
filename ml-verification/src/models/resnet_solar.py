# ResNet model for solar energy prediction
import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.layers import Dense, Flatten, GlobalAveragePooling2D, Input
from tensorflow.keras.models import Model

def solar_classifier(input_shape=(256,256,3), num_classes=3):
    base = ResNet50(weights=None, include_top=False, input_shape=input_shape)
    x = base.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    outputs = Dense(num_classes, activation='softmax')(x)
    return Model(inputs=base.input, outputs=outputs)
