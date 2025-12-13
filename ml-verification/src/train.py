"""
Training pipeline for CarbonCred ML verification models.
Supports vegetation segmentation and solar classification.

Usage:
    python train.py --task vegetation
    python train.py --task solar
"""
import os
import argparse
from pathlib import Path
import tensorflow as tf

# Ensure reproducibility
tf.random.set_seed(42)

# Get paths relative to src/
SRC_DIR = Path(__file__).parent
MANIFEST_PATH = SRC_DIR.parent / "synthetic_data" / "dataset_manifest.csv"
CHECKPOINT_DIR = SRC_DIR / "models" / "checkpoints"


def create_checkpoint_dir():
    """Create checkpoint directory if it doesn't exist."""
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)


def train_vegetation(epochs=10, batch_size=8, learning_rate=1e-4):
    """
    Train vegetation segmentation model using NDVI images.
    
    Args:
        epochs: Number of training epochs
        batch_size: Batch size for training
        learning_rate: Learning rate for optimizer
    """
    from datasets import get_vegetation_dataset
    from models.unet_ndvi import get_compiled_unet, dice_coefficient, iou_metric
    
    print("=" * 60)
    print("VEGETATION SEGMENTATION TRAINING")
    print("=" * 60)
    
    # Load datasets
    print("\nLoading vegetation datasets...")
    train_ds = get_vegetation_dataset(str(MANIFEST_PATH), batch_size, subset='train')
    val_ds = get_vegetation_dataset(str(MANIFEST_PATH), batch_size, subset='val')
    
    # Count samples
    train_count = sum(1 for _ in train_ds.unbatch())
    val_count = sum(1 for _ in val_ds.unbatch())
    print(f"Training samples: {train_count}")
    print(f"Validation samples: {val_count}")
    
    # Reload datasets after counting
    train_ds = get_vegetation_dataset(str(MANIFEST_PATH), batch_size, subset='train')
    val_ds = get_vegetation_dataset(str(MANIFEST_PATH), batch_size, subset='val')
    
    # Build model
    print("\nBuilding UNet model...")
    model = get_compiled_unet(input_shape=(256, 256, 1), learning_rate=learning_rate)
    model.summary()
    
    # Callbacks
    create_checkpoint_dir()
    checkpoint_path = CHECKPOINT_DIR / "vegetation_unet_best.keras"
    
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            str(checkpoint_path),
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    # Train
    print("\nStarting training...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        callbacks=callbacks,
        verbose=1
    )
    
    # Save final model
    final_path = CHECKPOINT_DIR / "vegetation_unet_final.keras"
    model.save(str(final_path))
    print(f"\nFinal model saved to: {final_path}")
    print(f"Best model saved to: {checkpoint_path}")
    
    # Print final metrics
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE")
    print("=" * 60)
    if history.history.get('val_dice_coefficient'):
        print(f"Best Val Dice: {max(history.history['val_dice_coefficient']):.4f}")
    if history.history.get('val_iou_metric'):
        print(f"Best Val IoU: {max(history.history['val_iou_metric']):.4f}")
    
    return history


def train_solar(epochs=10, batch_size=8, learning_rate=1e-4):
    """
    Train solar classification model using RGB images.
    
    Args:
        epochs: Number of training epochs
        batch_size: Batch size for training
        learning_rate: Learning rate for optimizer
    """
    from datasets import get_solar_dataset
    from models.resnet_solar import solar_classifier
    
    print("=" * 60)
    print("SOLAR CLASSIFICATION TRAINING")
    print("=" * 60)
    
    # Load datasets
    print("\nLoading solar datasets...")
    train_ds = get_solar_dataset(str(MANIFEST_PATH), batch_size, subset='train')
    val_ds = get_solar_dataset(str(MANIFEST_PATH), batch_size, subset='val')
    
    # Count samples
    train_count = sum(1 for _ in train_ds.unbatch())
    val_count = sum(1 for _ in val_ds.unbatch())
    print(f"Training samples: {train_count}")
    print(f"Validation samples: {val_count}")
    
    # Reload datasets
    train_ds = get_solar_dataset(str(MANIFEST_PATH), batch_size, subset='train')
    val_ds = get_solar_dataset(str(MANIFEST_PATH), batch_size, subset='val')
    
    # Build model
    print("\nBuilding ResNet solar classifier...")
    model = solar_classifier(input_shape=(256, 256, 3), num_classes=3)
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy', 
                 tf.keras.metrics.SparseCategoricalAccuracy(name='sparse_acc'),
                 tf.keras.metrics.SparseTopKCategoricalAccuracy(k=2, name='top2_acc')]
    )
    model.summary()
    
    # Callbacks
    create_checkpoint_dir()
    checkpoint_path = CHECKPOINT_DIR / "solar_resnet_best.keras"
    
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            str(checkpoint_path),
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor='val_accuracy',
            patience=5,
            restore_best_weights=True,
            mode='max',
            verbose=1
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    # Train
    print("\nStarting training...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        callbacks=callbacks,
        verbose=1
    )
    
    # Save final model
    final_path = CHECKPOINT_DIR / "solar_resnet_final.keras"
    model.save(str(final_path))
    print(f"\nFinal model saved to: {final_path}")
    print(f"Best model saved to: {checkpoint_path}")
    
    # Print final metrics
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE")
    print("=" * 60)
    if history.history.get('val_accuracy'):
        print(f"Best Val Accuracy: {max(history.history['val_accuracy']):.4f}")
    
    return history


def main():
    parser = argparse.ArgumentParser(
        description='Train CarbonCred ML verification models',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python train.py --task vegetation
    python train.py --task solar
    python train.py --task vegetation --epochs 20 --batch-size 16
        """
    )
    
    parser.add_argument(
        '--task',
        type=str,
        required=True,
        choices=['vegetation', 'solar'],
        help='Task to train: vegetation (segmentation) or solar (classification)'
    )
    
    parser.add_argument(
        '--epochs',
        type=int,
        default=10,
        help='Number of training epochs (default: 10)'
    )
    
    parser.add_argument(
        '--batch-size',
        type=int,
        default=8,
        help='Batch size for training (default: 8)'
    )
    
    parser.add_argument(
        '--learning-rate',
        type=float,
        default=1e-4,
        help='Learning rate (default: 0.0001)'
    )
    
    args = parser.parse_args()
    
    if args.task == 'vegetation':
        train_vegetation(
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.learning_rate
        )
    elif args.task == 'solar':
        train_solar(
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.learning_rate
        )


if __name__ == '__main__':
    main()
