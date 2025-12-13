# CarbonCred ML Verification Pipeline

AI/ML verification pipeline for CarbonCred carbon credit verification system. This module provides vegetation segmentation and solar installation classification models.

## Overview

The pipeline supports two main verification tasks:

1. **Vegetation Segmentation**: Uses UNet architecture with NDVI images to verify vegetation presence and detect changes over time.
2. **Solar Classification**: Uses ResNet-based classifier to identify solar installation sites.

## Directory Structure

```
ml-verification/
├── src/
│   ├── datasets.py          # Data loading utilities
│   ├── preprocessing.py     # Image preprocessing functions
│   ├── train.py             # Training pipeline
│   ├── evaluate.py          # Evaluation pipeline
│   ├── sanitycheck.py       # Dataset validation
│   └── models/
│       ├── unet_ndvi.py     # UNet for vegetation segmentation
│       ├── resnet_solar.py  # ResNet for solar classification
│       └── checkpoints/     # Saved model weights
├── synthetic_data/
│   ├── images/              # RGB images
│   ├── masks/               # Vegetation masks
│   ├── ndvi/                # NDVI images
│   ├── nir/                 # NIR images
│   └── dataset_manifest.csv # Dataset metadata
└── requirements.txt
```

## Installation

```bash
cd ml-verification
pip install -r requirements.txt
```

## Training

### Train Vegetation Segmentation Model

```bash
cd src
python train.py --task vegetation
```

**Options:**
- `--epochs`: Number of training epochs (default: 10)
- `--batch-size`: Batch size (default: 8)
- `--learning-rate`: Learning rate (default: 0.0001)

**Example with custom parameters:**
```bash
python train.py --task vegetation --epochs 20 --batch-size 16 --learning-rate 0.0001
```

**Model Output:**
- Best model saved to: `src/models/checkpoints/vegetation_unet_best.keras`
- Final model saved to: `src/models/checkpoints/vegetation_unet_final.keras`

### Train Solar Classification Model

```bash
cd src
python train.py --task solar
```

**Example:**
```bash
python train.py --task solar --epochs 15 --batch-size 8
```

**Model Output:**
- Best model saved to: `src/models/checkpoints/solar_resnet_best.keras`
- Final model saved to: `src/models/checkpoints/solar_resnet_final.keras`

## Evaluation

### Evaluate Vegetation Model

```bash
cd src
python evaluate.py --task vegetation
```

**Output Metrics:**
- Mean IoU (Intersection over Union)
- Mean Dice Coefficient
- Vegetation Consistency Score (detects unrealistic NDVI changes)

**Sample Output:**
```
============================================================
EVALUATION RESULTS
============================================================
Samples evaluated: 479
Mean IoU:  0.7279 (+/- 0.1672)
Mean Dice: 0.8305 (+/- 0.1259)
Min IoU:   0.1663
Max IoU:   0.9744

============================================================
VEGETATION CONSISTENCY CHECK
============================================================
Samples checked: 479
Mean Consistency Score: 0.9851
Flagged (score < 0.7): 0
Flag Rate: 0.00%
```

### Evaluate Solar Model

```bash
cd src
python evaluate.py --task solar
```

**Output Metrics:**
- Overall Accuracy
- Per-class Precision and Recall
- Macro-averaged metrics
- Confusion Matrix

**Sample Output:**
```
============================================================
EVALUATION RESULTS
============================================================
Samples evaluated: 120
Training Accuracy: ~69%
Validation Accuracy: 49.17%

Note: Results shown with 2 training epochs. Performance improves with:
- More training epochs (10-20 recommended)
- Data augmentation
- Hyperparameter tuning
```

## Model Architectures

### UNet for Vegetation Segmentation

- **Input**: NDVI images (256×256×1)
- **Output**: Binary vegetation mask (256×256×1)
- **Loss**: Binary Crossentropy + Dice Loss
- **Metrics**: IoU, Dice Coefficient

**Architecture:**
- Encoder: 4 blocks with 32→64→128→256 filters
- Bridge: 512 filters
- Decoder: 4 blocks with 256→128→64→32 filters
- Skip connections between encoder and decoder

### ResNet for Solar Classification

- **Input**: RGB images (256×256×3)
- **Output**: 3-class softmax (no_site, construction, active_solar)
- **Backbone**: ResNet50 (trained from scratch)
- **Loss**: Sparse Categorical Crossentropy

## API Integration

Models can be loaded for backend integration:

```python
import tensorflow as tf
from models.unet_ndvi import bce_dice_loss, dice_coefficient, iou_metric

# Load vegetation model
custom_objects = {
    'bce_dice_loss': bce_dice_loss,
    'dice_coefficient': dice_coefficient,
    'iou_metric': iou_metric
}
veg_model = tf.keras.models.load_model(
    'models/checkpoints/vegetation_unet_best.keras',
    custom_objects=custom_objects
)

# Predict vegetation mask
prediction = veg_model.predict(ndvi_image)  # ndvi_image: (1, 256, 256, 1)

# Load solar model
solar_model = tf.keras.models.load_model(
    'models/checkpoints/solar_resnet_best.keras'
)

# Classify solar installation
class_probs = solar_model.predict(rgb_image)  # rgb_image: (1, 256, 256, 3)
predicted_class = np.argmax(class_probs)
```

## Consistency Checking

The vegetation evaluation includes a consistency check that:
1. Analyzes NDVI values across multiple time frames
2. Flags unrealistic vegetation changes (>15% jump between frames)
3. Produces a consistency score (0-1, higher is better)

This helps detect potential fraud or data anomalies in carbon credit claims.

## User Inputs vs System Evidence

CarbonCred separates user-provided claims from system-verified evidence:

### User Inputs (What Users Provide)
| Field | Description |
|-------|-------------|
| `project_name` | Name of the carbon credit project |
| `project_type` | "vegetation" or "solar" |
| `project_coordinates` | Geographic location (lat/lon or polygon) |
| `project_area_hectares` | Total project area in hectares |
| `project_cost_lakh_inr` | Project cost in lakhs INR |
| `claimed_improvement_pct` | User's claimed environmental improvement |
| `project_images` | Satellite or drone imagery |

### System Evidence (AI-Generated)
| Field | Description |
|-------|-------------|
| `mean_iou` | Vegetation detection accuracy (0-1) |
| `mean_dice` | Segmentation quality score (0-1) |
| `temporal_consistency` | Change consistency over time (0-1) |
| `vegetation_coverage_pct` | Detected vegetation coverage |
| `ndvi_change` | Measured NDVI difference |
| `solar_probability` | Solar panel detection confidence |
| `estimated_carbon_seq` | Calculated CO₂ sequestration |

## Verification Logic

### Vegetation Projects

**Score Calculation:**
```
vegetation_score = 0.6 × mean_iou + 0.3 × mean_dice + 0.1 × temporal_consistency
```

**Impact Metrics:**
- `estimated_carbon_sequestration = 5.0 tCO₂/hectare/year × area × coverage`
- `soil_health_index = 1 - NDVI_variance`
- `aqi_improvement_proxy = coverage × soil_health_index`

**Decision Rules:**
| Condition | Decision |
|-----------|----------|
| `mean_iou < 0.5` | REJECTED |
| `temporal_consistency < 0.7` | REVIEW_REQUIRED |
| `claim_gap > 15%` | REVIEW_REQUIRED |
| All criteria met | VERIFIED |

### Solar Projects

**Energy Calculation:**
```
estimated_energy_mwh = panel_area × 4.5 hours × 365 days × 0.18 efficiency
avoided_co2_tco2 = energy × 0.7 (grid emission factor)
```

**Decision Rules:**
| Condition | Decision |
|-----------|----------|
| `solar_probability < 0.4` | REJECTED |
| Land use conflict detected | REVIEW_REQUIRED |
| Claim inconsistent with CO₂ | REVIEW_REQUIRED |
| All criteria met | VERIFIED |

## Project Verification CLI

Run verification on projects:

```bash
cd src

# List available projects
python verify.py --list

# Verify a vegetation project
python verify.py --project veg_001

# Verify a solar project
python verify.py --project solar_001

# Output JSON only
python verify.py --project veg_001 --output json
```

**Sample Output:**
```
============================================================
CARBONCRED VERIFICATION REPORT
============================================================

Project: Green Valley Reforestation
Type: VEGETATION
Decision: VERIFIED
Confidence: 72.8%
Claim Alignment: MEDIUM

------------------------------------------------------------
KEY METRICS
------------------------------------------------------------
  Vegetation Score: 0.7265
  Mean Iou: 0.7279
  Mean Dice: 0.8305
  Temporal Consistency: 0.9851
  Vegetation Coverage Pct: 75.00
  Estimated Carbon Sequestration Tco2 Year: 187.50

------------------------------------------------------------
EXPLANATION
------------------------------------------------------------
✓ PROJECT VERIFIED

The vegetation project has been verified based on satellite imagery analysis.
...
```

## Why CarbonCred Prevents Fake Credits

CarbonCred's verification system is designed to prevent fraudulent carbon credit claims:

### 1. **Independent Evidence Generation**
- AI models analyze satellite imagery independently
- Users cannot manipulate IoU, Dice, or NDVI values
- System-generated metrics override user claims

### 2. **Temporal Consistency Checks**
- Detects unrealistic vegetation changes (>15% jumps)
- Flags suspicious patterns for manual review
- Tracks project evolution over time

### 3. **Claim Alignment Verification**
- Compares user claims against measured data
- High claim gaps trigger REVIEW_REQUIRED
- Prevents over-reporting of environmental impact

### 4. **Deterministic Decision Rules**
- Clear thresholds for VERIFIED/REVIEW_REQUIRED/REJECTED
- No subjective interpretation
- Fully auditable decision logic

### 5. **Explainable Outputs**
- Every decision includes detailed rationale
- Regulators can understand WHY projects passed/failed
- JSON-serializable for integration with external systems

## Requirements

- Python 3.8+
- TensorFlow 2.10+
- NumPy
- Pandas
- Pillow

## Notes

- All paths resolve relative to `src/` directory
- Models are lightweight and suitable for CPU inference
- Training uses early stopping and learning rate reduction
- Dataset includes 600+ vegetation samples and 600+ solar samples
- Vegetation model achieves strong segmentation performance (IoU ~0.73, Dice ~0.83)
- High consistency score (0.985) indicates reliable vegetation change detection
- Solar model benefits from additional training epochs for production use
