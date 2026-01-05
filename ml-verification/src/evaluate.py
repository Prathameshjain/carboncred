"""
Evaluation pipeline for CarbonCred ML verification models.
Supports vegetation segmentation and solar classification evaluation.

Usage:
    python evaluate.py --task vegetation
    python evaluate.py --task solar
"""
import os
import argparse
from pathlib import Path
import numpy as np
import tensorflow as tf

# Ensure reproducibility
tf.random.set_seed(42)
np.random.seed(42)

# Get paths relative to src/
SRC_DIR = Path(__file__).parent
MANIFEST_PATH = SRC_DIR.parent / "synthetic_data" / "dataset_manifest.csv"
CHECKPOINT_DIR = SRC_DIR / "models" / "checkpoints"


def compute_iou(y_true, y_pred, threshold=0.5):
    """Compute Intersection over Union."""
    y_pred_bin = (y_pred > threshold).astype(np.float32)
    y_true_flat = y_true.flatten()
    y_pred_flat = y_pred_bin.flatten()
    
    intersection = np.sum(y_true_flat * y_pred_flat)
    union = np.sum(y_true_flat) + np.sum(y_pred_flat) - intersection
    
    if union == 0:
        return 1.0
    return intersection / union


def compute_dice(y_true, y_pred, threshold=0.5, smooth=1.0):
    """Compute Dice coefficient."""
    y_pred_bin = (y_pred > threshold).astype(np.float32)
    y_true_flat = y_true.flatten()
    y_pred_flat = y_pred_bin.flatten()
    
    intersection = np.sum(y_true_flat * y_pred_flat)
    return (2. * intersection + smooth) / (np.sum(y_true_flat) + np.sum(y_pred_flat) + smooth)


def evaluate_vegetation():
    """
    Evaluate vegetation segmentation model.
    Prints IoU and Dice scores on validation set.
    """
    from datasets import get_vegetation_dataset, get_vegetation_consistency_data
    from models.unet_ndvi import dice_coefficient, iou_metric, bce_dice_loss
    
    print("=" * 60)
    print("VEGETATION SEGMENTATION EVALUATION")
    print("=" * 60)
    
    # Load model
    model_path = CHECKPOINT_DIR / "vegetation_unet_best.keras"
    if not model_path.exists():
        model_path = CHECKPOINT_DIR / "vegetation_unet_final.keras"
    
    if not model_path.exists():
        print(f"ERROR: No trained model found at {CHECKPOINT_DIR}")
        print("Please run 'python train.py --task vegetation' first.")
        return
    
    print(f"\nLoading model from: {model_path}")
    custom_objects = {
        'bce_dice_loss': bce_dice_loss,
        'dice_coefficient': dice_coefficient,
        'iou_metric': iou_metric
    }
    model = tf.keras.models.load_model(str(model_path), custom_objects=custom_objects)
    
    # Load validation dataset
    print("Loading validation dataset...")
    val_ds = get_vegetation_dataset(str(MANIFEST_PATH), batch_size=1, subset='val')
    
    # Evaluate
    iou_scores = []
    dice_scores = []
    
    print("\nRunning evaluation...")
    for batch_idx, (images, masks) in enumerate(val_ds):
        predictions = model.predict(images, verbose=0)
        
        for i in range(images.shape[0]):
            y_true = masks[i].numpy()
            y_pred = predictions[i]
            
            iou = compute_iou(y_true, y_pred)
            dice = compute_dice(y_true, y_pred)
            
            iou_scores.append(iou)
            dice_scores.append(dice)
    
    # Print results
    print("\n" + "=" * 60)
    print("EVALUATION RESULTS")
    print("=" * 60)
    print(f"Samples evaluated: {len(iou_scores)}")
    print(f"\nMean IoU:  {np.mean(iou_scores):.4f} (+/- {np.std(iou_scores):.4f})")
    print(f"Mean Dice: {np.mean(dice_scores):.4f} (+/- {np.std(dice_scores):.4f})")
    print(f"Min IoU:   {np.min(iou_scores):.4f}")
    print(f"Max IoU:   {np.max(iou_scores):.4f}")
    
    # Consistency check
    print("\n" + "=" * 60)
    print("VEGETATION CONSISTENCY CHECK")
    print("=" * 60)
    
    consistency_data = get_vegetation_consistency_data(str(MANIFEST_PATH))
    consistency_scores = check_vegetation_consistency(consistency_data)
    
    print(f"\nSamples checked: {len(consistency_scores)}")
    print(f"Mean Consistency Score: {np.mean(consistency_scores):.4f}")
    print(f"Flagged (score < 0.7): {sum(1 for s in consistency_scores if s < 0.7)}")
    
    return {
        'iou_mean': np.mean(iou_scores),
        'iou_std': np.std(iou_scores),
        'dice_mean': np.mean(dice_scores),
        'dice_std': np.std(dice_scores),
        'consistency_mean': np.mean(consistency_scores)
    }


def check_vegetation_consistency(consistency_data, max_jump_threshold=0.15):
    """
    Check vegetation consistency across time frames.
    Flags unrealistic NDVI jumps between consecutive frames.
    
    Args:
        consistency_data: List of dicts with ndvi_values and timestamps
        max_jump_threshold: Maximum allowed NDVI change between frames
    
    Returns:
        List of consistency scores (0-1, higher is better)
    """
    consistency_scores = []
    
    for sample in consistency_data:
        ndvi_vals = sample['ndvi_values']
        
        if len(ndvi_vals) < 2:
            consistency_scores.append(1.0)
            continue
        
        jumps = []
        for i in range(1, len(ndvi_vals)):
            jump = abs(ndvi_vals[i] - ndvi_vals[i-1])
            jumps.append(jump)
        
        max_jump = max(jumps)
        avg_jump = np.mean(jumps)
        
        if max_jump > max_jump_threshold:
            score = max(0, 1 - (max_jump - max_jump_threshold) / max_jump_threshold)
        else:
            score = 1.0 - (avg_jump / max_jump_threshold) * 0.3
        
        consistency_scores.append(min(1.0, max(0.0, score)))
    
    return consistency_scores


def evaluate_solar():
    """
    Evaluate solar classification model.
    Prints Accuracy, Precision, Recall on validation set.
    """
    from datasets import get_solar_dataset
    
    print("=" * 60)
    print("SOLAR CLASSIFICATION EVALUATION")
    print("=" * 60)
    
    # Load model
    model_path = CHECKPOINT_DIR / "solar_resnet_best.keras"
    if not model_path.exists():
        model_path = CHECKPOINT_DIR / "solar_resnet_final.keras"
    
    if not model_path.exists():
        print(f"ERROR: No trained model found at {CHECKPOINT_DIR}")
        print("Please run 'python train.py --task solar' first.")
        return
    
    print(f"\nLoading model from: {model_path}")
    model = tf.keras.models.load_model(str(model_path))
    
    # Load validation dataset
    print("Loading validation dataset...")
    val_ds = get_solar_dataset(str(MANIFEST_PATH), batch_size=1, subset='val')
    
    # Evaluate
    all_true = []
    all_pred = []
    
    print("\nRunning evaluation...")
    for images, labels in val_ds:
        predictions = model.predict(images, verbose=0)
        pred_classes = np.argmax(predictions, axis=1)
        
        all_true.extend(labels.numpy())
        all_pred.extend(pred_classes)
    
    all_true = np.array(all_true)
    all_pred = np.array(all_pred)
    
    # Compute metrics
    accuracy = np.mean(all_true == all_pred)
    
    # Per-class metrics
    class_names = ['no_site', 'construction', 'active_solar']
    num_classes = 3
    
    precision_per_class = []
    recall_per_class = []
    
    for c in range(num_classes):
        true_positive = np.sum((all_pred == c) & (all_true == c))
        false_positive = np.sum((all_pred == c) & (all_true != c))
        false_negative = np.sum((all_pred != c) & (all_true == c))
        
        precision = true_positive / (true_positive + false_positive + 1e-8)
        recall = true_positive / (true_positive + false_negative + 1e-8)
        
        precision_per_class.append(precision)
        recall_per_class.append(recall)
    
    # Print results
    print("\n" + "=" * 60)
    print("EVALUATION RESULTS")
    print("=" * 60)
    print(f"Samples evaluated: {len(all_true)}")
    print(f"\nOverall Accuracy: {accuracy:.4f}")
    
    print(f"\nPer-Class Metrics:")
    print(f"{'Class':<15} {'Precision':<12} {'Recall':<12}")
    print("-" * 40)
    for i, name in enumerate(class_names):
        print(f"{name:<15} {precision_per_class[i]:<12.4f} {recall_per_class[i]:<12.4f}")
    
    print(f"\nMacro Precision: {np.mean(precision_per_class):.4f}")
    print(f"Macro Recall:    {np.mean(recall_per_class):.4f}")
    
    # Confusion matrix
    print("\nConfusion Matrix:")
    print(f"{'Pred →':<10}", end='')
    for name in class_names:
        print(f"{name[:8]:<10}", end='')
    print()
    print("-" * 40)
    
    for i, true_name in enumerate(class_names):
        print(f"{true_name[:8]:<10}", end='')
        for j in range(num_classes):
            count = np.sum((all_true == i) & (all_pred == j))
            print(f"{count:<10}", end='')
        print()
    
    return {
        'accuracy': accuracy,
        'precision_macro': np.mean(precision_per_class),
        'recall_macro': np.mean(recall_per_class),
        'precision_per_class': precision_per_class,
        'recall_per_class': recall_per_class
    }


def main():
    parser = argparse.ArgumentParser(
        description='Evaluate CarbonCred ML verification models',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python evaluate.py --task vegetation
    python evaluate.py --task solar
        """
    )
    
    parser.add_argument(
        '--task',
        type=str,
        required=True,
        choices=['vegetation', 'solar'],
        help='Task to evaluate: vegetation (segmentation) or solar (classification)'
    )
    
    args = parser.parse_args()
    
    if args.task == 'vegetation':
        evaluate_vegetation()
    elif args.task == 'solar':
        evaluate_solar()


if __name__ == '__main__':
    main()
