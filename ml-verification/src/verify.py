#!/usr/bin/env python3
"""
CarbonCred Verification CLI

Command-line interface for running project verification.
Loads user metadata and AI outputs, runs verification, and saves reports.
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from verification_engine import CarbonCredVerificationEngine


# Sample project database (simulates user submissions)
SAMPLE_PROJECTS = {
    "veg_001": {
        "user_metadata": {
            "project_name": "Green Valley Reforestation",
            "project_type": "vegetation",
            "project_area_hectares": 50.0,
            "project_cost_lakh_inr": 25.0,
            "claimed_improvement_pct": 15.0,
            "project_coordinates": {"lat": 19.076, "lon": 72.877}
        },
        "ai_outputs": {
            "mean_iou": 0.7279,
            "mean_dice": 0.8305,
            "temporal_consistency": 0.9851,
            "vegetation_masks": None,
            "ndvi_images": None
        }
    },
    "veg_002": {
        "user_metadata": {
            "project_name": "Sahyadri Forest Restoration",
            "project_type": "vegetation",
            "project_area_hectares": 120.0,
            "project_cost_lakh_inr": 60.0,
            "claimed_improvement_pct": 25.0,
            "project_coordinates": {"lat": 18.520, "lon": 73.856}
        },
        "ai_outputs": {
            "mean_iou": 0.45,
            "mean_dice": 0.55,
            "temporal_consistency": 0.65,
            "vegetation_masks": None,
            "ndvi_images": None
        }
    },
    "veg_003": {
        "user_metadata": {
            "project_name": "Urban Green Belt Project",
            "project_type": "vegetation",
            "project_area_hectares": 25.0,
            "project_cost_lakh_inr": 15.0,
            "claimed_improvement_pct": 40.0,
            "project_coordinates": {"lat": 19.229, "lon": 72.854}
        },
        "ai_outputs": {
            "mean_iou": 0.72,
            "mean_dice": 0.81,
            "temporal_consistency": 0.88,
            "vegetation_masks": None,
            "ndvi_images": None
        }
    },
    "solar_001": {
        "user_metadata": {
            "project_name": "Rajasthan Solar Farm",
            "project_type": "solar",
            "project_area_hectares": 10.0,
            "project_cost_lakh_inr": 500.0,
            "claimed_improvement_pct": 20.0,
            "project_coordinates": {"lat": 26.912, "lon": 75.787}
        },
        "ai_outputs": {
            "mean_iou": 0.0,
            "mean_dice": 0.0,
            "temporal_consistency": 0.95,
            "solar_probability": 0.85
        }
    },
    "solar_002": {
        "user_metadata": {
            "project_name": "Industrial Rooftop Solar",
            "project_type": "solar",
            "project_area_hectares": 2.0,
            "project_cost_lakh_inr": 80.0,
            "claimed_improvement_pct": 15.0,
            "project_coordinates": {"lat": 19.033, "lon": 73.029}
        },
        "ai_outputs": {
            "mean_iou": 0.0,
            "mean_dice": 0.0,
            "temporal_consistency": 0.92,
            "solar_probability": 0.35
        }
    }
}


def load_project(project_id: str) -> dict:
    """
    Load project data by ID.
    
    In production, this would query the database.
    """
    if project_id in SAMPLE_PROJECTS:
        return SAMPLE_PROJECTS[project_id]
    
    # Try loading from JSON file
    reports_dir = Path(__file__).parent / "reports"
    project_file = reports_dir / f"{project_id}_input.json"
    
    if project_file.exists():
        with open(project_file, 'r') as f:
            return json.load(f)
    
    return None


def save_report(result: dict, project_id: str) -> str:
    """Save verification report to JSON file."""
    reports_dir = Path(__file__).parent / "reports"
    reports_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{project_id}_report_{timestamp}.json"
    filepath = reports_dir / filename
    
    report = {
        "report_id": f"RPT-{timestamp}",
        "generated_at": datetime.now().isoformat(),
        "verification_result": result
    }
    
    with open(filepath, 'w') as f:
        json.dump(report, f, indent=2)
    
    return str(filepath)


def print_result(result: dict):
    """Print verification result to console."""
    print("\n" + "=" * 60)
    print("CARBONCRED VERIFICATION REPORT")
    print("=" * 60)
    
    print(f"\nProject: {result['project_name']}")
    print(f"Type: {result['project_type'].upper()}")
    print(f"Decision: {result['final_decision']}")
    print(f"Confidence: {result['confidence_score']:.1%}")
    print(f"Claim Alignment: {result['claim_alignment']}")
    
    print("\n" + "-" * 60)
    print("KEY METRICS")
    print("-" * 60)
    for key, value in result['key_metrics'].items():
        formatted_key = key.replace('_', ' ').title()
        if isinstance(value, float):
            print(f"  {formatted_key}: {value:.4f}")
        else:
            print(f"  {formatted_key}: {value}")
    
    print("\n" + "-" * 60)
    print("EXPLANATION")
    print("-" * 60)
    print(result['explanation'])
    
    print("\n" + "=" * 60)


def list_projects():
    """List all available sample projects."""
    print("\nAvailable Projects:")
    print("-" * 60)
    
    for pid, data in SAMPLE_PROJECTS.items():
        meta = data['user_metadata']
        print(f"  {pid}: {meta['project_name']} ({meta['project_type']})")
    
    print("-" * 60)
    print("\nUse: python verify.py --project <project_id>")


def main():
    parser = argparse.ArgumentParser(
        description="CarbonCred Verification CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python verify.py --project veg_001
  python verify.py --project solar_001
  python verify.py --list
        """
    )
    
    parser.add_argument(
        "--project", "-p",
        type=str,
        help="Project ID to verify"
    )
    
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List all available projects"
    )
    
    parser.add_argument(
        "--output", "-o",
        type=str,
        choices=["json", "text", "both"],
        default="both",
        help="Output format (default: both)"
    )
    
    parser.add_argument(
        "--no-save",
        action="store_true",
        help="Don't save report to file"
    )
    
    args = parser.parse_args()
    
    if args.list:
        list_projects()
        return 0
    
    if not args.project:
        parser.print_help()
        print("\n[Error] Please specify a project ID with --project")
        return 1
    
    # Load project
    project_data = load_project(args.project)
    
    if project_data is None:
        print(f"\n[Error] Project '{args.project}' not found")
        list_projects()
        return 1
    
    # Run verification
    engine = CarbonCredVerificationEngine()
    result = engine.verify(
        user_metadata=project_data['user_metadata'],
        ai_outputs=project_data['ai_outputs']
    )
    
    # Output results
    if args.output in ["text", "both"]:
        print_result(result)
    
    if args.output == "json":
        print(json.dumps(result, indent=2))
    
    # Save report
    if not args.no_save:
        filepath = save_report(result, args.project)
        print(f"\n📄 Report saved to: {filepath}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
