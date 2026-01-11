"""
generate_synthetic_dataset_realistic.py

Procedural drone canopy model v2 - Ultra-realistic forest generator.
Produces RGB + NIR + NDVI + mask + manifest CSV with:
  - Dense overlapping organic canopy crowns
  - Depth-based occlusion and shadows
  - Realistic tropical soil background
  - Proper NDVI distribution
  - Long and short-term growth simulation

Place in: ml-verification/src/
Run: python generate_synthetic_dataset_realistic.py
"""

import os
import csv
import json
import random
from pathlib import Path
from datetime import datetime, timedelta

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

# ---------------------
# Config
# ---------------------
OUT_ROOT = Path(__file__).resolve().parents[1] / "synthetic_data"
IM_DIR = OUT_ROOT / "images"
NIR_DIR = OUT_ROOT / "nir"
NDVI_DIR = OUT_ROOT / "ndvi"
MASK_DIR = OUT_ROOT / "masks"
CSV_PATH = OUT_ROOT / "dataset_manifest.csv"

IMAGE_SIZE = (256, 256)
VEG_SAMPLES = 600
SOLAR_SAMPLES = 600
MIN_FRAMES = 3
MAX_FRAMES = 5
SEED = 1234

# Realism parameters (tuned for Option B)
TARGET_CANOPY_COVERAGE = 0.85  # 80-90%
SHADOW_DARKENING = 0.30  # 25-35%
CROWN_RADIUS_MIN = 4
CROWN_RADIUS_MAX = 20
CLUSTER_COUNT_RANGE = (2, 6)  # forest clusters per tile
CROWNS_PER_CLUSTER_RANGE = (150, 400)  # dense packing

random.seed(SEED)
np.random.seed(SEED)

# create dirs
for d in (IM_DIR, NIR_DIR, NDVI_DIR, MASK_DIR):
    d.mkdir(parents=True, exist_ok=True)


# ---------------------
# Utilities
# ---------------------
def rand_coord():
    return round(random.uniform(-60, 60), 6), round(random.uniform(-180, 180), 6)

def poisson_disk_sample(width, height, min_distance, max_attempts=30):
    """Generate Poisson disk samples (evenly spaced points) for cluster centers."""
    cell_size = min_distance / np.sqrt(2)
    grid_w = int(width / cell_size) + 1
    grid_h = int(height / cell_size) + 1
    
    grid = [[None for _ in range(grid_w)] for _ in range(grid_h)]
    active = []
    samples = []
    
    # Start with random first point
    first = (random.uniform(0, width), random.uniform(0, height))
    samples.append(first)
    active.append(first)
    grid[int(first[1] / cell_size)][int(first[0] / cell_size)] = first
    
    while active:
        idx = random.randint(0, len(active) - 1)
        point = active[idx]
        found = False
        
        for _ in range(max_attempts):
            angle = random.uniform(0, 2 * np.pi)
            distance = random.uniform(min_distance, 2 * min_distance)
            new_x = point[0] + distance * np.cos(angle)
            new_y = point[1] + distance * np.sin(angle)
            
            if 0 <= new_x < width and 0 <= new_y < height:
                grid_x = int(new_x / cell_size)
                grid_y = int(new_y / cell_size)
                
                search_start_x = max(0, grid_x - 2)
                search_end_x = min(grid_w, grid_x + 3)
                search_start_y = max(0, grid_y - 2)
                search_end_y = min(grid_h, grid_y + 3)
                
                too_close = False
                for sy in range(search_start_y, search_end_y):
                    for sx in range(search_start_x, search_end_x):
                        neighbor = grid[sy][sx]
                        if neighbor is not None:
                            dx = neighbor[0] - new_x
                            dy = neighbor[1] - new_y
                            if dx*dx + dy*dy < min_distance*min_distance:
                                too_close = True
                                break
                    if too_close:
                        break
                
                if not too_close:
                    new_point = (new_x, new_y)
                    samples.append(new_point)
                    active.append(new_point)
                    grid[grid_y][grid_x] = new_point
                    found = True
                    break
        
        if not found:
            active.pop(idx)
    
    return samples

def save_uint8(arr, path):
    if arr.dtype != np.uint8:
        arr = np.clip(arr, 0, 255).astype(np.uint8)
    Image.fromarray(arr).save(path)

def date_shift(start, days):
    base = datetime.strptime(start, "%Y-%m-%d")
    return (base + timedelta(days=days)).strftime("%Y-%m-%d")


# ---------------------
# Procedural noise helpers
# ---------------------
def fbm_noise(shape, octaves=4, lacunarity=2.0, gain=0.5, scale=1.0):
    """
    Fractal Brownian Motion using FFT smoothing with scale parameter.
    """
    h, w = shape
    total = np.zeros((h, w), dtype=np.float32)
    freq = 1.0
    amp = 1.0

    for _ in range(octaves):
        noise = np.random.normal(0, 1, (h, w)).astype(np.float32)
        f = np.fft.rfft2(noise)
        ky = np.fft.fftfreq(h)
        kx = np.fft.rfftfreq(w)
        ky, kx = np.meshgrid(ky, kx, indexing="ij")
        sigma = max(0.5, (1.0 / freq) * 2.0)
        gauss = np.exp(-(kx**2 + ky**2) * (sigma**2)).astype(np.float32)
        smooth = np.fft.irfft2(f * gauss, s=(h, w))
        total += smooth * amp
        amp *= gain
        freq *= lacunarity

    mn, mx = total.min(), total.max()
    if mx - mn < 1e-6:
        return np.zeros_like(total)
    return ((total - mn) / (mx - mn)) * scale


def perlin_like_noise(shape, scale=50):
    """Generate smooth Perlin-like noise by interpolating grid values."""
    h, w = shape
    grid_h = h // scale + 2
    grid_w = w // scale + 2
    
    # Random gradients
    gradients = np.random.randn(grid_h, grid_w, 2)
    gradients /= np.linalg.norm(gradients, axis=2, keepdims=True)
    
    noise = np.zeros((h, w), dtype=np.float32)
    
    for y in range(h):
        for x in range(w):
            grid_x = x / scale
            grid_y = y / scale
            
            grid_xi = int(grid_x)
            grid_yi = int(grid_y)
            fx = grid_x - grid_xi
            fy = grid_y - grid_yi
            
            # Smoothstep
            sx = 3 * fx**2 - 2 * fx**3
            sy = 3 * fy**2 - 2 * fy**3
            
            g00 = gradients[grid_yi, grid_xi]
            g10 = gradients[grid_yi, grid_xi + 1]
            g01 = gradients[grid_yi + 1, grid_xi]
            g11 = gradients[grid_yi + 1, grid_xi + 1]
            
            n00 = np.dot(g00, [fx, fy])
            n10 = np.dot(g10, [fx - 1, fy])
            n01 = np.dot(g01, [fx, fy - 1])
            n11 = np.dot(g11, [fx - 1, fy - 1])
            
            nx0 = n00 * (1 - sx) + n10 * sx
            nx1 = n01 * (1 - sx) + n11 * sx
            noise[y, x] = nx0 * (1 - sy) + nx1 * sy
    
    noise = (noise - noise.min()) / (noise.max() - noise.min() + 1e-6)
    return noise


# ---------------------
# Tropical soil background
# ---------------------
def tropical_soil_background(w, h):
    """Generate realistic tropical forest soil with reddish-brown tones."""
    # Base reddish-brown colors
    color_dark = np.array([120, 70, 50], dtype=np.float32)      # dark earth
    color_mid = np.array([160, 100, 70], dtype=np.float32)      # mid earth
    color_light = np.array([200, 140, 100], dtype=np.float32)   # light earth
    
    # Layer 1: Large-scale variation
    base_noise = fbm_noise((h, w), octaves=3, gain=0.6, scale=1.0)
    
    # Layer 2: Medium-scale soil variation
    soil_variation = perlin_like_noise((h, w), scale=40)
    
    # Layer 3: Fine texture
    fine_texture = fbm_noise((h, w), octaves=5, gain=0.4, scale=0.3)
    
    # Blend colors
    blend1 = base_noise
    blend2 = soil_variation
    
    # Color mixing
    c1 = color_dark[None, None, :] * (1 - blend1[..., None]) + color_mid[None, None, :] * blend1[..., None]
    c2 = c1 * (1 - blend2[..., None]) + color_light[None, None, :] * blend2[..., None]
    
    # Add fine speckle
    c2 += (fine_texture[..., None] - 0.5) * 40
    
    # Subtle shadow variation from height
    height_variation = fbm_noise((h, w), octaves=2, gain=0.5, scale=1.0)
    c2 *= (0.8 + 0.2 * height_variation[..., None])
    
    return np.clip(c2, 0, 255).astype(np.uint8)


# ---------------------
# Advanced crown rendering with depth
# ---------------------
class CrownRenderer:
    """Render tree crowns with proper depth, shape variation, and shadows."""
    
    def __init__(self, width, height):
        self.w = width
        self.h = height
        self.depth_map = np.zeros((height, width), dtype=np.float32)
        self.rgb = np.zeros((height, width, 3), dtype=np.float32)
    
    def add_crown(self, cx, cy, radius, depth_val, color_inner, color_outer, shape_noise=None):
        """Add a single crown with proper blending and occlusion."""
        # Create crown shape with variation
        y, x = np.ogrid[-radius:radius+1, -radius:radius+1]
        rr = x*x + y*y
        maxr = radius*radius
        
        if shape_noise is not None:
            # Apply shape irregularity
            angle = np.arctan2(y, x)
            radial_noise = shape_noise.get((int(cx), int(cy)), 
                                          np.random.uniform(0.8, 1.2, (radius+1)))
            if isinstance(radial_noise, (float, int)):
                radial_noise = np.full((radius+1,), radial_noise)
            
            # Apply noise to radius
            dist = np.sqrt(rr)
            normalized_dist = (dist / (radius + 1e-6))
            mask_idx = np.clip((normalized_dist * len(radial_noise)).astype(int), 0, len(radial_noise)-1)
            variation = np.take(radial_noise, mask_idx)
            mask = np.clip(1 - (rr / maxr) * variation, 0, 1)
        else:
            mask = np.clip(1 - (rr / maxr), 0, 1)
        
        # Soft falloff
        mask = mask ** 0.6
        
        # Color blend from inner to outer
        inner = np.array(color_inner, dtype=np.float32)
        outer = np.array(color_outer, dtype=np.float32)
        color_blend = inner[None, None, :] * mask[..., None] + outer[None, None, :] * (1 - mask[..., None])
        
        # Compute image coordinates
        y0 = max(0, cy - radius)
        y1 = min(self.h, cy + radius + 1)
        x0 = max(0, cx - radius)
        x1 = min(self.w, cx + radius + 1)
        
        # Corresponding crown region
        cy0 = max(0, radius - cy)
        cy1 = cy0 + (y1 - y0)
        cx0 = max(0, radius - cx)
        cx1 = cx0 + (x1 - x0)
        
        crown_mask = mask[cy0:cy1, cx0:cx1]
        crown_color = color_blend[cy0:cy1, cx0:cx1]
        
        # Depth-based blending (simple: blend if current depth is smaller)
        current_depth = self.depth_map[y0:y1, x0:x1]
        blend_factor = np.where(depth_val > current_depth, crown_mask, 0)
        
        self.rgb[y0:y1, x0:x1] = (
            self.rgb[y0:y1, x0:x1] * (1 - blend_factor[..., None]) +
            crown_color * blend_factor[..., None]
        )
        self.depth_map[y0:y1, x0:x1] = np.maximum(
            self.depth_map[y0:y1, x0:x1],
            depth_val * blend_factor
        )
    
    def get_rgb(self):
        return np.clip(self.rgb, 0, 255).astype(np.uint8)
    
    def get_depth(self):
        return self.depth_map


# ---------------------
# Forest cluster generation
# ---------------------
def generate_forest_clusters(w, h, num_clusters, target_coverage=0.85):
    """
    Generate forest clusters positioned using Poisson disk sampling.
    Returns cluster centers and their parameters.
    """
    min_distance = max(w, h) // (num_clusters + 1)
    centers = poisson_disk_sample(w, h, min_distance, max_attempts=30)
    
    if len(centers) > num_clusters:
        centers = centers[:num_clusters]
    
    clusters = []
    for cx, cy in centers:
        radius = random.uniform(40, 90)
        crown_count = random.randint(CROWNS_PER_CLUSTER_RANGE[0], CROWNS_PER_CLUSTER_RANGE[1])
        clusters.append({
            'center': (int(cx), int(cy)),
            'radius': radius,
            'crown_count': crown_count,
            'density_variation': fbm_noise((int(radius*2), int(radius*2)), octaves=3)
        })
    
    return clusters


def render_forest_clusters(w, h, clusters, growth_factor=1.0):
    """
    Render dense overlapping forest canopy with proper depth and shadows.
    Returns RGB image, canopy mask, and depth map.
    """
    renderer = CrownRenderer(w, h)
    
    # Green color palette for tropical forest
    crown_palettes = [
        # Dark, medium, light green variants
        {'inner': (25, 80, 20), 'outer': (50, 120, 40)},
        {'inner': (35, 100, 30), 'outer': (70, 150, 60)},
        {'inner': (40, 110, 35), 'outer': (90, 180, 80)},
        {'inner': (30, 95, 25), 'outer': (65, 140, 55)},
        {'inner': (45, 120, 40), 'outer': (100, 200, 90)},
    ]
    
    all_crowns = []
    
    for cluster in clusters:
        cx, cy = cluster['center']
        cr = cluster['radius']
        crown_count = int(cluster['crown_count'] * growth_factor)
        
        # Generate crown positions within cluster using Poisson disk
        local_min_distance = 4
        local_centers = poisson_disk_sample(int(cr*2.5), int(cr*2.5), local_min_distance, max_attempts=20)
        
        # Filter to actually within cluster bounds
        valid_crowns = []
        for lx, ly in local_centers:
            global_x = cx - cr*1.25 + lx
            global_y = cy - cr*1.25 + ly
            
            # Check if within cluster circle
            dx = global_x - cx
            dy = global_y - cy
            dist = np.sqrt(dx*dx + dy*dy)
            
            if dist < cr and 0 <= global_x < w and 0 <= global_y < h:
                valid_crowns.append((int(global_x), int(global_y)))
        
        # Assign depths and sizes
        for idx, (crx, cry) in enumerate(valid_crowns[:crown_count]):
            # Depth decreases toward cluster edge (farther = lower depth)
            dx = crx - cx
            dy = cry - cy
            dist_to_center = np.sqrt(dx*dx + dy*dy)
            depth = 0.9 - 0.5 * (dist_to_center / cr)
            depth = max(0.1, depth)
            
            # Size variation: larger in center, smaller at edges
            size_factor = 1.0 - 0.4 * (dist_to_center / cr)
            radius = int(random.uniform(CROWN_RADIUS_MIN, CROWN_RADIUS_MAX) * size_factor)
            radius = max(2, radius)
            
            # Color variation
            palette = random.choice(crown_palettes)
            
            all_crowns.append({
                'x': crx, 'y': cry, 'r': radius, 'depth': depth,
                'palette': palette
            })
    
    # Sort by depth (render back to front)
    all_crowns.sort(key=lambda c: c['depth'])
    
    # Render crowns
    for crown in all_crowns:
        renderer.add_crown(
            crown['x'], crown['y'], crown['r'], crown['depth'],
            crown['palette']['inner'], crown['palette']['outer'],
            shape_noise=None
        )
    
    rgb = renderer.get_rgb()
    depth = renderer.get_depth()
    
    # Compute canopy mask from depth
    mask = (depth > 0.3).astype(np.uint8)
    
    return rgb, mask, depth


# ---------------------
# Apply atmospheric effects
# ---------------------
def apply_atmospheric_effects(rgb, mask, depth):
    """Add shadows, atmospheric haze, and sensor noise."""
    h, w = rgb.shape[:2]
    
    # Directional shadows from depth
    shadow_angle = np.deg2rad(random.uniform(20, 70))
    shadow_elevation = np.deg2rad(random.uniform(30, 70))
    
    # Simple shadow map from depth
    dx_shadow = np.cos(shadow_angle) * 15
    dy_shadow = np.sin(shadow_angle) * 15
    
    shifted_depth = np.roll(depth, shift=(int(dy_shadow), int(dx_shadow)), axis=(0, 1))
    shadow_strength = np.maximum(0, shifted_depth - depth) * 2.0
    shadow_strength = np.clip(shadow_strength, 0, 1)
    
    # Apply shadow darkening
    output = rgb.astype(np.float32)
    output = output * (1.0 - SHADOW_DARKENING * shadow_strength[..., None])
    
    # Light elevation effect
    elevation_effect = 0.5 + 0.5 * np.sin(np.deg2rad(random.uniform(30, 70)))
    output = output * elevation_effect
    
    # Subtle atmospheric haze (farther = hazier)
    haze_color = np.array([220, 210, 200], dtype=np.float32)  # warm haze
    haze_factor = (1 - depth[..., None]) * 0.1
    output = output * (1 - haze_factor) + haze_color[None, None, :] * haze_factor
    
    # Sensor noise
    noise = np.random.normal(0, 4, output.shape)
    output = output + noise
    
    # Vignette effect (natural camera edge darkening)
    y, x = np.ogrid[:h, :w]
    vignette = 1.0 - 0.3 * np.sqrt((x - w/2)**2 + (y - h/2)**2) / np.sqrt((w/2)**2 + (h/2)**2)
    vignette = np.clip(vignette, 0.7, 1.0)
    output = output * vignette[..., None]
    
    # Slight blur to simulate camera lens
    pil_img = Image.fromarray(np.clip(output, 0, 255).astype(np.uint8))
    pil_img = pil_img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.3, 0.8)))
    output = np.array(pil_img).astype(np.float32)
    
    return np.clip(output, 0, 255).astype(np.uint8)


# ---------------------
# Generate NIR and NDVI
# ---------------------
def generate_nir_from_rgb(rgb, mask, ndvi_strength=0.7):
    """
    Generate synthetic NIR channel where vegetation reflects strongly.
    Uses realistic NDVI response.
    """
    r = rgb[..., 0].astype(np.float32)
    g = rgb[..., 1].astype(np.float32)
    b = rgb[..., 2].astype(np.float32)
    
    # NIR is high in vegetation, low in soil
    # Realistic formula: vegetation is very reflective in NIR
    nir = g * (1.2 + 0.4 * ndvi_strength) + r * 0.15 + b * 0.05
    
    # Add more boost in masked regions
    nir = nir + mask.astype(np.float32) * (80 * ndvi_strength)
    
    # Add sensor-like noise
    nir = nir + np.random.normal(0, 8, nir.shape)
    
    return np.clip(nir, 0, 255).astype(np.uint8)


def compute_ndvi_uint8(nir, red):
    """Compute NDVI from NIR and Red channels, normalized to 0-255."""
    nir_f = nir.astype(np.float32)
    red_f = red.astype(np.float32)
    
    denom = (nir_f + red_f)
    # Handle division by zero
    ndvi = np.where(denom == 0, 0.0, (nir_f - red_f) / denom)
    
    # Normalize NDVI from [-1, 1] to [0, 255]
    # Most vegetation ranges 0.3-0.8, so we map more carefully
    ndvi_norm = ((ndvi + 1.0) / 2.0) * 255.0
    ndvi_norm = np.clip(ndvi_norm, 0, 255).astype(np.uint8)
    
    return ndvi_norm


# ---------------------
# Make a realistic vegetation sample (time-series)
# ---------------------
def make_vegetation_sample(sid):
    """
    Generate time-series vegetation samples with realistic growth patterns.
    Includes both short-term (seasonal) and long-term (yearly) variations.
    """
    h, w = IMAGE_SIZE[1], IMAGE_SIZE[0]
    
    # Determine growth pattern: short-term (seasonal), long-term (recovery/deforestation), or stable
    growth_pattern = random.choices(
        ["short_term", "long_term", "stable"],
        weights=[0.35, 0.40, 0.25]
    )[0]
    
    # Determine label
    if growth_pattern == "long_term":
        label = random.choices(["growth", "deforestation"], weights=[0.6, 0.4])[0]
    else:
        label = random.choices(["growth", "no_growth", "deforestation"], weights=[0.3, 0.5, 0.2])[0]
    
    # Generate base forest clusters
    num_clusters = random.randint(CLUSTER_COUNT_RANGE[0], CLUSTER_COUNT_RANGE[1])
    base_clusters = generate_forest_clusters(w, h, num_clusters, TARGET_CANOPY_COVERAGE)
    
    frames_rgb = []
    frames_nir = []
    frames_ndvi = []
    timestamps = []
    ndvi_means = []
    
    start_date = "2019-01-01"
    start_offset = random.randint(0, 900)
    start = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=start_offset)).strftime("%Y-%m-%d")
    
    num_frames = random.randint(MIN_FRAMES, MAX_FRAMES)
    
    # Generate frames with growth simulation
    for t in range(num_frames):
        step = t / max(1, num_frames - 1)
        
        # Growth factor progression
        if label == "growth":
            if growth_pattern == "short_term":
                # Seasonal variation: oscillating around base level
                growth_factor = 0.8 + 0.35 * np.sin(step * 2 * np.pi) + 0.15 * step
            else:
                # Long-term recovery: steady increase
                growth_factor = 0.7 + 0.4 * step
        elif label == "deforestation":
            if growth_pattern == "long_term":
                # Steady decline
                growth_factor = 1.0 - 0.5 * step
            else:
                # Seasonal with slight decline
                growth_factor = 0.95 - 0.3 * step + 0.1 * np.sin(step * 2 * np.pi)
        else:  # no_growth
            # Seasonal fluctuation around stable level
            growth_factor = 0.9 + 0.15 * np.sin(step * 2 * np.pi)
        
        growth_factor = np.clip(growth_factor, 0.3, 1.2)
        
        # Start with tropical soil background
        base_rgb = tropical_soil_background(w, h)
        
        # Render forest clusters
        canopy_rgb, canopy_mask, depth_map = render_forest_clusters(w, h, base_clusters, growth_factor)
        
        # Blend canopy with soil
        final_rgb = base_rgb.astype(np.float32)
        blend_factor = canopy_mask.astype(np.float32)[..., None] / 255.0
        final_rgb = final_rgb * (1 - blend_factor) + canopy_rgb.astype(np.float32) * blend_factor
        final_rgb = final_rgb.astype(np.uint8)
        
        # Apply atmospheric effects (shadows, haze, noise)
        final_rgb = apply_atmospheric_effects(final_rgb, canopy_mask, depth_map)
        
        # Generate NIR and NDVI
        nir = generate_nir_from_rgb(final_rgb, canopy_mask, ndvi_strength=0.65 + 0.3 * growth_factor)
        ndvi = compute_ndvi_uint8(nir, final_rgb[..., 0])
        
        # Save files
        fname_rgb = IM_DIR / f"veg_{sid:05d}_{t}_rgb.png"
        fname_nir = NIR_DIR / f"veg_{sid:05d}_{t}_nir.png"
        fname_ndvi = NDVI_DIR / f"veg_{sid:05d}_{t}_ndvi.png"
        
        save_uint8(final_rgb, fname_rgb)
        save_uint8(nir, fname_nir)
        save_uint8(ndvi, fname_ndvi)
        
        frames_rgb.append(str(fname_rgb))
        frames_nir.append(str(fname_nir))
        frames_ndvi.append(str(fname_ndvi))
        
        # Store NDVI statistics
        ndvi_mean = float(ndvi.mean()) / 255.0
        ndvi_means.append(ndvi_mean)
        
        # Timestamp progression
        if growth_pattern == "short_term":
            # Seasonal: frames ~3 months apart
            frame_days = int(t * random.randint(80, 120))
        else:
            # Long-term: frames ~6-12 months apart
            frame_days = int(t * random.randint(150, 365))
        
        timestamps.append(date_shift(start, frame_days))
    
    # Final mask from last frame
    final_mask = Image.fromarray((canopy_mask * 255).astype(np.uint8))
    final_mask = final_mask.filter(ImageFilter.GaussianBlur(radius=1.5))
    final_mask = final_mask.point(lambda p: 255 if p > 128 else 0)
    final_mask_path = MASK_DIR / f"mask_veg_{sid:05d}.png"
    final_mask.save(final_mask_path)
    
    # Metadata
    metadata = {
        "biome": random.choice(["tropical_rainforest", "tropical_monsoon", "dry_tropical"]),
        "area_ha": round(float(np.sum(canopy_mask)) / (w * h) * random.uniform(2.0, 15.0), 3),
        "growth_pattern": growth_pattern,
        "cluster_count": num_clusters,
        "mean_ndvi": round(float(np.mean(ndvi_means)), 3),
    }
    
    return {
        "sample_id": f"V{sid:05d}",
        "project_type": "vegetation",
        "image_paths": "|".join(frames_rgb),
        "timestamp_paths": "|".join(timestamps),
        "lat": rand_coord()[0],
        "lon": rand_coord()[1],
        "label": label,
        "ndvi_values": "|".join([f"{v:.4f}" for v in ndvi_means]),
        "mask_path": str(final_mask_path),
        "metadata_json": json.dumps(metadata),
    }


def save_uint8(arr, path):
    """Save array as uint8 PNG."""
    if arr.dtype != np.uint8:
        arr = np.clip(arr, 0, 255).astype(np.uint8)
    Image.fromarray(arr).save(path)


# ---------------------
# Solar generator (with realism matching vegetation)
# ---------------------
def make_solar_sample(sid):
    """
    Generate realistic solar installation drone imagery.
    Includes proper shadows, atmospheric effects, and sensor simulation.
    """
    w, h = IMAGE_SIZE
    
    # Determine label
    label = random.choices(
        ["no_site", "construction", "active_solar"],
        weights=[0.45, 0.25, 0.30]
    )[0]
    
    # Start with tropical soil background
    base_rgb = tropical_soil_background(w, h)
    img = base_rgb.astype(np.float32)
    
    boxes = []
    panel_count = 0
    depth_map = np.zeros((h, w), dtype=np.float32)
    
    if label in ["construction", "active_solar"]:
        # Generate organized solar panel grid
        # More realistic: rows and columns with perspective variation
        num_rows = random.randint(5, 14)
        num_cols = random.randint(10, 28)
        
        # Grid spacing with slight irregularity
        spacing_x = int(w / (num_cols + 2))
        spacing_y = int(h / (num_rows + 2))
        
        # Perspective effect: panels get smaller toward horizon
        horizon_y = random.randint(int(h * 0.3), int(h * 0.7))
        
        # Panel colors vary based on angle/condition
        panel_colors = [
            np.array([35, 45, 75], dtype=np.float32),   # dark blue (good condition)
            np.array([45, 55, 85], dtype=np.float32),   # medium blue
            np.array([55, 65, 95], dtype=np.float32),   # lighter blue (degraded)
            np.array([40, 50, 80], dtype=np.float32),   # standard
        ]
        
        for r in range(num_rows):
            for c in range(num_cols):
                # Base position
                cx = int((c + 1) * spacing_x + random.randint(-3, 3))
                cy = int((r + 1) * spacing_y + random.randint(-2, 2))
                
                # Perspective: panels smaller toward horizon
                if horizon_y > h // 2:
                    # Horizon at bottom - near panels are larger
                    dist_to_horizon = abs(cy - horizon_y) / h
                    scale = 1.0 - 0.4 * (1.0 - dist_to_horizon)
                else:
                    # Horizon at top - far panels are smaller
                    dist_to_horizon = abs(cy - horizon_y) / h
                    scale = 0.6 + 0.4 * dist_to_horizon
                
                scale = np.clip(scale, 0.4, 1.2)
                
                # Panel dimensions
                pw = int(random.randint(12, 24) * scale)
                ph = int(random.randint(6, 14) * scale)
                
                if pw < 3 or ph < 3:
                    continue
                
                x0 = max(0, cx - pw // 2)
                y0 = max(0, cy - ph // 2)
                x1 = min(w, x0 + pw)
                y1 = min(h, y0 + ph)
                
                if (x1 - x0) < 2 or (y1 - y0) < 2:
                    continue
                
                # Panel color with variation
                panel_color = random.choice(panel_colors)
                
                # Subtle reflectance variation
                panel_noise = fbm_noise((y1-y0, x1-x0), octaves=2, gain=0.6, scale=0.15)
                panel_rgb = panel_color[None, None, :] * (0.85 + 0.15 * panel_noise[..., None])
                
                # Add reflection hotspot (glossy effect)
                if random.random() > 0.3:
                    spot_y = random.randint(0, y1-y0-1)
                    spot_x = random.randint(0, x1-x0-1)
                    spot_size = max(1, int((x1-x0) * random.uniform(0.1, 0.25)))
                    
                    for dy in range(max(0, spot_y-spot_size), min(y1-y0, spot_y+spot_size)):
                        for dx in range(max(0, spot_x-spot_size), min(x1-x0, spot_x+spot_size)):
                            dist = np.sqrt((dx - spot_x)**2 + (dy - spot_y)**2)
                            if dist < spot_size:
                                bright = 0.7 * (1 - dist / spot_size)
                                panel_rgb[dy, dx, :] = np.clip(panel_rgb[dy, dx, :] * (1 + bright), 0, 255)
                
                # Render panel
                img[y0:y1, x0:x1, :] = np.clip(panel_rgb, 0, 255)
                
                # Directional shadow (cast by panel depth)
                shadow_length = int(2 * scale)
                shadow_angle = random.uniform(30, 60)
                shadow_dx = int(np.cos(np.deg2rad(shadow_angle)) * shadow_length)
                shadow_dy = int(np.sin(np.deg2rad(shadow_angle)) * shadow_length)
                
                shadow_x0 = max(0, x1 + shadow_dx)
                shadow_y0 = max(0, y1 + shadow_dy)
                shadow_x1 = min(w, shadow_x0 + max(1, pw // 3))
                shadow_y1 = min(h, shadow_y0 + max(1, 2))
                
                if shadow_x1 > shadow_x0 and shadow_y1 > shadow_y0:
                    img[shadow_y0:shadow_y1, shadow_x0:shadow_x1, :] *= 0.65
                
                # Track depth and boxes
                depth_map[y0:y1, x0:x1] = scale
                boxes.append({
                    "x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0,
                    "scale": float(scale)
                })
                panel_count += 1
    else:
        # No solar site: just natural terrain or sparse structures
        for _ in range(random.randint(0, 2)):
            # Random small structures (roads, buildings)
            x0 = random.randint(20, w - 60)
            y0 = random.randint(20, h - 60)
            x1 = x0 + random.randint(30, 80)
            y1 = y0 + random.randint(15, 60)
            # Ensure within bounds
            x1 = min(w, x1)
            y1 = min(h, y1)
            if x1 <= x0 or y1 <= y0:
                continue
            # Concrete/road color
            structure_color = np.array([140, 140, 145], dtype=np.float32)
            # Add texture
            struct_noise = fbm_noise((y1-y0, x1-x0), octaves=2, gain=0.6, scale=0.2)
            struct_rgb = structure_color[None, None, :] * (0.8 + 0.2 * struct_noise[..., None])
            # Defensive: match shape to fit
            region_shape = img[y0:y1, x0:x1, :].shape
            struct_rgb = struct_rgb[:region_shape[0], :region_shape[1], :]
            img[y0:y1, x0:x1, :] = np.clip(struct_rgb, 0, 255)
    
    # Apply atmospheric effects
    output = apply_atmospheric_effects(img.astype(np.uint8), np.zeros((h, w), dtype=np.uint8), depth_map)
    
    # Add subtle compression artifacts (common in real drone imagery)
    pil_img = Image.fromarray(output)
    pil_img = pil_img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.2, 0.5)))
    output = np.array(pil_img).astype(np.uint8)
    
    # Add sensor noise and chromatic aberration
    noise = np.random.normal(0, 3.5, output.shape)
    output = np.clip(output.astype(np.float32) + noise, 0, 255).astype(np.uint8)
    
    # Contrast adjustment
    pil_img = Image.fromarray(output)
    pil_img = ImageOps.autocontrast(pil_img, cutoff=2)
    output = np.array(pil_img).astype(np.uint8)
    
    # Save image
    fname = IM_DIR / f"solar_{sid:05d}.png"
    save_uint8(output, fname)
    
    metadata = {
        "panel_count": panel_count,
        "installation_type": label,
        "boxes": boxes,
        "has_structure": len(boxes) > 0,
    }
    
    return {
        "sample_id": f"S{sid:05d}",
        "project_type": "solar",
        "image_paths": str(fname),
        "timestamp_paths": "",
        "lat": rand_coord()[0],
        "lon": rand_coord()[1],
        "label": label,
        "ndvi_values": "",
        "mask_path": "",
        "metadata_json": json.dumps(metadata),
    }


# ---------------------
# Main generation routine
# ---------------------
def main():
    rows = []
    
    print("=" * 60)
    print("PROCEDURAL DRONE CANOPY MODEL V2")
    print("=" * 60)
    print(f"Generating {VEG_SAMPLES} vegetation samples...")
    print(f"  Target canopy coverage: {TARGET_CANOPY_COVERAGE*100:.0f}%")
    print(f"  Shadow darkening: {SHADOW_DARKENING*100:.0f}%")
    print(f"  Soil type: Tropical (reddish-brown)")
    print()
    for i in range(VEG_SAMPLES):
        if (i + 1) % 50 == 0:
            print(f"  Generated {i+1}/{VEG_SAMPLES} vegetation samples")
        rows.append(make_vegetation_sample(i))
    
    print(f"\nGenerating {SOLAR_SAMPLES} solar samples...")
    for i in range(SOLAR_SAMPLES):
        if (i + 1) % 50 == 0:
            print(f"  Generated {i+1}/{SOLAR_SAMPLES} solar samples")
        rows.append(make_solar_sample(i))
    
    # Write CSV manifest
    fieldnames = [
        "sample_id", "project_type", "image_paths", "timestamp_paths",
        "lat", "lon", "label", "ndvi_values", "mask_path", "metadata_json"
    ]
    
    with open(CSV_PATH, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    
    print("\n" + "=" * 60)
    print("GENERATION COMPLETE")
    print("=" * 60)
    print(f"Manifest saved: {CSV_PATH.resolve()}")
    print(f"Output directory: {OUT_ROOT.resolve()}")
    print(f"Total samples: {len(rows)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
