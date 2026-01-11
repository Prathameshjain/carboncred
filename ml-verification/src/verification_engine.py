"""
CarbonCred Verification Engine

Converts user claims + AI outputs into final verification decisions.
Produces explainable, regulator-ready reports.
"""

import numpy as np
from typing import Dict, Any, Optional, List


class CarbonCredVerificationEngine:
    """
    Main verification engine for CarbonCred carbon credit verification.
    
    Supports:
    - Vegetation projects (reforestation, afforestation)
    - Solar projects (solar panel installations)
    """
    
    # Decision constants
    VERIFIED = "VERIFIED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    REJECTED = "REJECTED"
    
    # Thresholds
    VEGETATION_IOU_REJECT_THRESHOLD = 0.5
    TEMPORAL_CONSISTENCY_REVIEW_THRESHOLD = 0.7
    CLAIM_GAP_REVIEW_THRESHOLD = 15.0  # percentage
    SOLAR_PROBABILITY_REJECT_THRESHOLD = 0.4
    
    # Carbon sequestration constants
    CARBON_SEQ_TCO2_PER_HECTARE_YEAR = 5.0
    
    # Solar energy constants
    SOLAR_HOURS_PER_DAY = 4.5
    SOLAR_PANEL_EFFICIENCY = 0.18
    GRID_EMISSION_FACTOR = 0.7  # tCO2/MWh
    
    def __init__(self):
        """Initialize the verification engine."""
        self.last_result = None
    
    def verify(
        self,
        user_metadata: Dict[str, Any],
        ai_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Main verification method.
        
        Args:
            user_metadata: User-provided project information
                - project_name (str)
                - project_type (str): "vegetation" or "solar"
                - project_area_hectares (float)
                - project_cost_lakh_inr (float)
                - claimed_improvement_pct (float)
            ai_outputs: System-generated AI metrics
                - mean_iou (float)
                - mean_dice (float)
                - temporal_consistency (float)
                - vegetation_masks (optional)
                - ndvi_images (optional)
                - solar_probability (float, optional)
        
        Returns:
            Dict with verification result including decision, metrics, explanation
        """
        project_type = user_metadata.get("project_type", "").lower()
        
        if project_type == "vegetation":
            result = self._verify_vegetation(user_metadata, ai_outputs)
        elif project_type == "solar":
            result = self._verify_solar(user_metadata, ai_outputs)
        else:
            result = self._create_error_result(
                user_metadata,
                f"Unknown project type: {project_type}"
            )
        
        self.last_result = result
        return result
    
    def _verify_vegetation(
        self,
        user_metadata: Dict[str, Any],
        ai_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Vegetation project verification logic.
        
        Score formula:
            vegetation_score = 0.6 * mean_iou + 0.3 * mean_dice + 0.1 * temporal_consistency
        """
        # Extract inputs
        project_name = user_metadata.get("project_name", "Unknown")
        area_hectares = user_metadata.get("project_area_hectares", 0.0)
        claimed_improvement = user_metadata.get("claimed_improvement_pct", 0.0)
        
        mean_iou = ai_outputs.get("mean_iou", 0.0)
        mean_dice = ai_outputs.get("mean_dice", 0.0)
        temporal_consistency = ai_outputs.get("temporal_consistency", 0.0)
        vegetation_masks = ai_outputs.get("vegetation_masks", None)
        ndvi_images = ai_outputs.get("ndvi_images", None)
        
        # Compute vegetation score
        vegetation_score = (
            0.6 * mean_iou +
            0.3 * mean_dice +
            0.1 * temporal_consistency
        )
        
        # Calculate vegetation coverage from masks
        vegetation_coverage_pct = self._calculate_vegetation_coverage(vegetation_masks)
        
        # Calculate vegetation growth from NDVI
        vegetation_growth_pct, ndvi_change = self._calculate_vegetation_growth(ndvi_images)
        
        # Soil health index = 1 - NDVI_variance
        soil_health_index = self._calculate_soil_health(ndvi_images)
        
        # Estimated carbon sequestration
        estimated_carbon_seq = (
            self.CARBON_SEQ_TCO2_PER_HECTARE_YEAR *
            area_hectares *
            (vegetation_coverage_pct / 100.0)
        )
        
        # AQI improvement proxy
        aqi_improvement_proxy = (vegetation_coverage_pct / 100.0) * soil_health_index
        
        # Claim alignment
        claim_gap = claimed_improvement - vegetation_growth_pct
        claim_alignment = self._determine_claim_alignment(claim_gap)
        
        # Decision logic
        decision, reasons = self._vegetation_decision(
            mean_iou, temporal_consistency, claim_gap
        )
        
        # Confidence score
        confidence_score = min(1.0, max(0.0, vegetation_score))
        
        # Generate explanation
        explanation = self._generate_vegetation_explanation(
            decision, reasons, mean_iou, mean_dice, temporal_consistency,
            vegetation_coverage_pct, vegetation_growth_pct, claim_gap,
            estimated_carbon_seq
        )
        
        return {
            "project_name": project_name,
            "project_type": "vegetation",
            "final_decision": decision,
            "confidence_score": round(confidence_score, 4),
            "claim_alignment": claim_alignment,
            "key_metrics": {
                "vegetation_score": round(vegetation_score, 4),
                "mean_iou": round(mean_iou, 4),
                "mean_dice": round(mean_dice, 4),
                "temporal_consistency": round(temporal_consistency, 4),
                "vegetation_coverage_pct": round(vegetation_coverage_pct, 2),
                "vegetation_growth_pct": round(vegetation_growth_pct, 2),
                "ndvi_change": round(ndvi_change, 4),
                "soil_health_index": round(soil_health_index, 4),
                "estimated_carbon_sequestration_tco2_year": round(estimated_carbon_seq, 2),
                "aqi_improvement_proxy": round(aqi_improvement_proxy, 4),
                "claim_gap_pct": round(claim_gap, 2),
                "area_hectares": area_hectares
            },
            "explanation": explanation,
            "decision_reasons": reasons
        }
    
    def _verify_solar(
        self,
        user_metadata: Dict[str, Any],
        ai_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Solar project verification logic.
        
        Energy calculation:
            estimated_energy_mwh_year = panel_area × 4.5 × 365 × 0.18
        """
        # Extract inputs
        project_name = user_metadata.get("project_name", "Unknown")
        area_hectares = user_metadata.get("project_area_hectares", 0.0)
        claimed_improvement = user_metadata.get("claimed_improvement_pct", 0.0)
        
        solar_probability = ai_outputs.get("solar_probability", 0.0)
        mean_iou = ai_outputs.get("mean_iou", 0.0)
        
        # Estimate panel area (from segmentation or area estimate)
        # Assuming solar_probability indicates % of area with panels
        estimated_panel_area_m2 = area_hectares * 10000 * solar_probability
        
        # Energy calculation: panel_area × 4.5 hours × 365 days × 0.18 efficiency
        # Result in kWh, convert to MWh
        estimated_energy_kwh = (
            estimated_panel_area_m2 *
            self.SOLAR_HOURS_PER_DAY *
            365 *
            self.SOLAR_PANEL_EFFICIENCY
        )
        estimated_energy_mwh = estimated_energy_kwh / 1000.0
        
        # Avoided CO2
        avoided_co2_tco2 = estimated_energy_mwh * self.GRID_EMISSION_FACTOR
        
        # Calculate claim alignment for solar
        # claimed_improvement_pct interpreted as expected CO2 reduction
        expected_co2_baseline = area_hectares * 10  # Baseline assumption
        actual_improvement_pct = (avoided_co2_tco2 / max(expected_co2_baseline, 1)) * 100
        claim_gap = claimed_improvement - actual_improvement_pct
        claim_alignment = self._determine_claim_alignment(claim_gap)
        
        # Land use conflict detection (simplified)
        land_use_conflict = self._detect_land_use_conflict(ai_outputs)
        
        # Decision logic
        decision, reasons = self._solar_decision(
            solar_probability, land_use_conflict, claim_gap
        )
        
        # Confidence score based on solar probability
        confidence_score = min(1.0, max(0.0, solar_probability))
        
        # Generate explanation
        explanation = self._generate_solar_explanation(
            decision, reasons, solar_probability, estimated_panel_area_m2,
            estimated_energy_mwh, avoided_co2_tco2, claim_gap, land_use_conflict
        )
        
        return {
            "project_name": project_name,
            "project_type": "solar",
            "final_decision": decision,
            "confidence_score": round(confidence_score, 4),
            "claim_alignment": claim_alignment,
            "key_metrics": {
                "solar_probability": round(solar_probability, 4),
                "estimated_panel_area_m2": round(estimated_panel_area_m2, 2),
                "estimated_energy_mwh_year": round(estimated_energy_mwh, 2),
                "avoided_co2_tco2_year": round(avoided_co2_tco2, 2),
                "land_use_conflict": land_use_conflict,
                "claim_gap_pct": round(claim_gap, 2),
                "area_hectares": area_hectares
            },
            "explanation": explanation,
            "decision_reasons": reasons
        }
    
    def _calculate_vegetation_coverage(self, masks: Optional[Any]) -> float:
        """Calculate vegetation coverage percentage from masks."""
        if masks is None:
            return 75.0  # Default assumption
        
        try:
            if isinstance(masks, np.ndarray):
                return float(np.mean(masks > 0.5) * 100)
            elif isinstance(masks, list) and len(masks) > 0:
                total_coverage = sum(np.mean(m > 0.5) for m in masks)
                return float(total_coverage / len(masks) * 100)
        except Exception:
            pass
        
        return 75.0
    
    def _calculate_vegetation_growth(self, ndvi_images: Optional[Any]) -> tuple:
        """Calculate vegetation growth percentage and NDVI change."""
        if ndvi_images is None:
            return 10.0, 0.1  # Default assumptions
        
        try:
            if isinstance(ndvi_images, list) and len(ndvi_images) >= 2:
                first_ndvi = np.mean(ndvi_images[0])
                last_ndvi = np.mean(ndvi_images[-1])
                ndvi_change = last_ndvi - first_ndvi
                growth_pct = (ndvi_change / max(first_ndvi, 0.01)) * 100
                return float(growth_pct), float(ndvi_change)
            elif isinstance(ndvi_images, np.ndarray):
                return 10.0, float(np.mean(ndvi_images))
        except Exception:
            pass
        
        return 10.0, 0.1
    
    def _calculate_soil_health(self, ndvi_images: Optional[Any]) -> float:
        """Calculate soil health index as 1 - NDVI variance."""
        if ndvi_images is None:
            return 0.8  # Default assumption
        
        try:
            if isinstance(ndvi_images, list):
                variances = [np.var(img) for img in ndvi_images]
                mean_variance = np.mean(variances)
            else:
                mean_variance = np.var(ndvi_images)
            
            # Normalize variance (assuming max variance ~0.25 for NDVI range 0-1)
            normalized_variance = min(mean_variance / 0.25, 1.0)
            return float(1.0 - normalized_variance)
        except Exception:
            pass
        
        return 0.8
    
    def _determine_claim_alignment(self, claim_gap: float) -> str:
        """Determine claim alignment category."""
        abs_gap = abs(claim_gap)
        if abs_gap <= 5:
            return "HIGH"
        elif abs_gap <= 15:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _vegetation_decision(
        self,
        mean_iou: float,
        temporal_consistency: float,
        claim_gap: float
    ) -> tuple:
        """Apply vegetation decision rules."""
        reasons = []
        
        # Rule 1: IoU threshold
        if mean_iou < self.VEGETATION_IOU_REJECT_THRESHOLD:
            reasons.append(f"Mean IoU ({mean_iou:.4f}) below threshold ({self.VEGETATION_IOU_REJECT_THRESHOLD})")
            return self.REJECTED, reasons
        
        # Rule 2: Temporal consistency
        if temporal_consistency < self.TEMPORAL_CONSISTENCY_REVIEW_THRESHOLD:
            reasons.append(f"Temporal consistency ({temporal_consistency:.4f}) below threshold ({self.TEMPORAL_CONSISTENCY_REVIEW_THRESHOLD})")
            return self.REVIEW_REQUIRED, reasons
        
        # Rule 3: Claim gap
        if claim_gap > self.CLAIM_GAP_REVIEW_THRESHOLD:
            reasons.append(f"Claim gap ({claim_gap:.2f}%) exceeds threshold ({self.CLAIM_GAP_REVIEW_THRESHOLD}%)")
            return self.REVIEW_REQUIRED, reasons
        
        reasons.append("All verification criteria met")
        return self.VERIFIED, reasons
    
    def _solar_decision(
        self,
        solar_probability: float,
        land_use_conflict: bool,
        claim_gap: float
    ) -> tuple:
        """Apply solar decision rules."""
        reasons = []
        
        # Rule 1: Solar probability threshold
        if solar_probability < self.SOLAR_PROBABILITY_REJECT_THRESHOLD:
            reasons.append(f"Solar probability ({solar_probability:.4f}) below threshold ({self.SOLAR_PROBABILITY_REJECT_THRESHOLD})")
            return self.REJECTED, reasons
        
        # Rule 2: Land use conflict
        if land_use_conflict:
            reasons.append("Land use conflict detected")
            return self.REVIEW_REQUIRED, reasons
        
        # Rule 3: Claim inconsistency
        if claim_gap > self.CLAIM_GAP_REVIEW_THRESHOLD:
            reasons.append(f"Claim gap ({claim_gap:.2f}%) inconsistent with avoided CO2")
            return self.REVIEW_REQUIRED, reasons
        
        reasons.append("All verification criteria met")
        return self.VERIFIED, reasons
    
    def _detect_land_use_conflict(self, ai_outputs: Dict[str, Any]) -> bool:
        """Detect potential land use conflicts."""
        # Simplified detection based on available metrics
        vegetation_detected = ai_outputs.get("mean_iou", 0) > 0.6
        solar_detected = ai_outputs.get("solar_probability", 0) > 0.5
        
        # Conflict if both vegetation and solar are strongly detected
        return vegetation_detected and solar_detected
    
    def _generate_vegetation_explanation(
        self,
        decision: str,
        reasons: List[str],
        mean_iou: float,
        mean_dice: float,
        temporal_consistency: float,
        vegetation_coverage_pct: float,
        vegetation_growth_pct: float,
        claim_gap: float,
        estimated_carbon_seq: float
    ) -> str:
        """Generate human-readable explanation for vegetation projects."""
        lines = []
        
        if decision == self.VERIFIED:
            lines.append("✓ PROJECT VERIFIED")
            lines.append("")
            lines.append("The vegetation project has been verified based on satellite imagery analysis.")
        elif decision == self.REVIEW_REQUIRED:
            lines.append("⚠ REVIEW REQUIRED")
            lines.append("")
            lines.append("The project requires manual review due to the following concerns:")
        else:
            lines.append("✗ PROJECT REJECTED")
            lines.append("")
            lines.append("The project does not meet minimum verification standards:")
        
        lines.append("")
        lines.append("ANALYSIS SUMMARY:")
        lines.append(f"• Vegetation detection accuracy (IoU): {mean_iou:.1%}")
        lines.append(f"• Segmentation quality (Dice): {mean_dice:.1%}")
        lines.append(f"• Temporal consistency: {temporal_consistency:.1%}")
        lines.append(f"• Current vegetation coverage: {vegetation_coverage_pct:.1f}%")
        lines.append(f"• Measured vegetation growth: {vegetation_growth_pct:.1f}%")
        
        lines.append("")
        lines.append("ENVIRONMENTAL IMPACT:")
        lines.append(f"• Estimated carbon sequestration: {estimated_carbon_seq:.2f} tCO₂/year")
        
        lines.append("")
        lines.append("CLAIM VERIFICATION:")
        if abs(claim_gap) <= 5:
            lines.append(f"• User claim aligns well with measured data (gap: {claim_gap:.1f}%)")
        elif claim_gap > 0:
            lines.append(f"• User claim exceeds measured growth by {claim_gap:.1f}%")
        else:
            lines.append(f"• User claim is conservative by {abs(claim_gap):.1f}%")
        
        lines.append("")
        lines.append("DECISION RATIONALE:")
        for reason in reasons:
            lines.append(f"• {reason}")
        
        return "\n".join(lines)
    
    def _generate_solar_explanation(
        self,
        decision: str,
        reasons: List[str],
        solar_probability: float,
        panel_area: float,
        energy_mwh: float,
        avoided_co2: float,
        claim_gap: float,
        land_use_conflict: bool
    ) -> str:
        """Generate human-readable explanation for solar projects."""
        lines = []
        
        if decision == self.VERIFIED:
            lines.append("✓ PROJECT VERIFIED")
            lines.append("")
            lines.append("The solar installation project has been verified based on imagery analysis.")
        elif decision == self.REVIEW_REQUIRED:
            lines.append("⚠ REVIEW REQUIRED")
            lines.append("")
            lines.append("The project requires manual review due to the following concerns:")
        else:
            lines.append("✗ PROJECT REJECTED")
            lines.append("")
            lines.append("The project does not meet minimum verification standards:")
        
        lines.append("")
        lines.append("ANALYSIS SUMMARY:")
        lines.append(f"• Solar panel detection confidence: {solar_probability:.1%}")
        lines.append(f"• Estimated panel area: {panel_area:.2f} m²")
        lines.append(f"• Land use conflict detected: {'Yes' if land_use_conflict else 'No'}")
        
        lines.append("")
        lines.append("ENVIRONMENTAL IMPACT:")
        lines.append(f"• Estimated annual energy generation: {energy_mwh:.2f} MWh")
        lines.append(f"• Estimated CO₂ emissions avoided: {avoided_co2:.2f} tCO₂/year")
        
        lines.append("")
        lines.append("CLAIM VERIFICATION:")
        if abs(claim_gap) <= 5:
            lines.append(f"• User claim aligns well with calculated impact (gap: {claim_gap:.1f}%)")
        elif claim_gap > 0:
            lines.append(f"• User claim exceeds calculated impact by {claim_gap:.1f}%")
        else:
            lines.append(f"• User claim is conservative by {abs(claim_gap):.1f}%")
        
        lines.append("")
        lines.append("DECISION RATIONALE:")
        for reason in reasons:
            lines.append(f"• {reason}")
        
        return "\n".join(lines)
    
    def _create_error_result(
        self,
        user_metadata: Dict[str, Any],
        error_message: str
    ) -> Dict[str, Any]:
        """Create error result for invalid inputs."""
        return {
            "project_name": user_metadata.get("project_name", "Unknown"),
            "project_type": user_metadata.get("project_type", "unknown"),
            "final_decision": self.REJECTED,
            "confidence_score": 0.0,
            "claim_alignment": "LOW",
            "key_metrics": {},
            "explanation": f"Error: {error_message}",
            "decision_reasons": [error_message]
        }
