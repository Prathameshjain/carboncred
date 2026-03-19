"""
CarbonCred Verification Engine

Converts user claims + AI outputs into final verification decisions.
Produces explainable, regulator-ready reports.
"""

import math
import numpy as np
from typing import Dict, Any, Optional, List


class CarbonCredVerificationEngine:
    """
    Main verification engine for CarbonCred carbon credit verification.
    
    Supports:
    - Vegetation projects (reforestation, afforestation)
    - Solar projects (solar panel installations)
    - Methane / Biogas projects
    - Cookstove / ICS projects
    - Wind Energy projects
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
                - project_type (str): "vegetation", "solar", "methane", "cookstove", "wind"
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
        elif project_type == "methane":
            result = self._verify_methane(user_metadata, ai_outputs)
        elif project_type == "cookstove":
            result = self._verify_cookstove(user_metadata, ai_outputs)
        elif project_type == "wind":
            result = self._verify_wind(user_metadata, ai_outputs)
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
        
        # ── Numeric cross-check ────────────────────────────────────────────
        tree_count    = user_metadata.get("tree_count")
        avg_dbh_mm    = user_metadata.get("avg_dbh_mm")
        avg_height_cm = user_metadata.get("avg_height_cm")
        species_factor = user_metadata.get("species_factor")

        formula_computed_credits = None
        ml_estimated_credits     = None
        cross_check_gap_pct      = None

        if decision != self.REJECTED:
            if (tree_count and tree_count > 0 and
                    avg_dbh_mm and avg_dbh_mm > 0 and
                    avg_height_cm and avg_height_cm > 0 and
                    species_factor and species_factor > 0):

                formula_credits = int(
                    (avg_dbh_mm * avg_height_cm * tree_count * species_factor * 50 * 367) / (10 ** 12)
                )
                ml_credits = int(area_hectares * 200)
                gap_pct = abs(formula_credits - ml_credits) / max(ml_credits, 1) * 100

                formula_computed_credits = formula_credits
                ml_estimated_credits     = ml_credits
                cross_check_gap_pct      = round(gap_pct, 2)

                if gap_pct > 150 and decision == self.VERIFIED:
                    decision = self.REJECTED
                    reasons.append(
                        "Formula credits deviate more than 150% from ML area estimate "
                        "— possible inflation of tree measurements"
                    )
                elif gap_pct > 50 and decision == self.VERIFIED:
                    decision = self.REVIEW_REQUIRED
                    reasons.append(
                        f"Formula credits deviate {gap_pct:.1f}% from ML area estimate "
                        "— manual review required"
                    )
            else:
                # Numeric inputs missing — cannot fully verify
                if decision == self.VERIFIED:
                    decision = self.REVIEW_REQUIRED
                    reasons.append(
                        "Numeric inputs (DBH, height, tree count, species factor) are required "
                        "to calculate credits — project cannot be fully verified without them"
                    )

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
                "area_hectares": area_hectares,
                "formula_computed_credits": formula_computed_credits,
                "ml_estimated_credits": ml_estimated_credits,
                "cross_check_gap_pct": cross_check_gap_pct,
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
        estimated_panel_area_m2 = area_hectares * 10000 * solar_probability
        
        # Energy calculation: panel_area × 4.5 hours × 365 days × 0.18 efficiency
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
        expected_co2_baseline = area_hectares * 10
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
        
        # ── Numeric cross-check ────────────────────────────────────────────
        energy_generated_kwh  = user_metadata.get("energy_generated_kwh")
        grid_emission_factor  = user_metadata.get("grid_emission_factor")
        solar_efficiency_pct  = user_metadata.get("solar_efficiency_pct")

        formula_computed_credits = None
        ml_estimated_credits     = None
        cross_check_gap_pct      = None

        if decision != self.REJECTED:
            if (energy_generated_kwh and energy_generated_kwh > 0 and
                    grid_emission_factor and grid_emission_factor > 0 and
                    solar_efficiency_pct and solar_efficiency_pct > 0):

                formula_credits = int(
                    (energy_generated_kwh * grid_emission_factor * solar_efficiency_pct) / (10 ** 8)
                )
                ml_kwh = estimated_energy_mwh * 1000
                gap_pct = abs(energy_generated_kwh - ml_kwh) / max(ml_kwh, 1) * 100

                ml_credits = int(ml_kwh * grid_emission_factor * solar_efficiency_pct / (10 ** 8))

                formula_computed_credits = formula_credits
                ml_estimated_credits     = ml_credits
                cross_check_gap_pct      = round(gap_pct, 2)

                if gap_pct > 150 and decision == self.VERIFIED:
                    decision = self.REJECTED
                    reasons.append(
                        "Reported energy generation deviates more than 150% from ML panel area "
                        "estimate — possible inflation"
                    )
                elif gap_pct > 50 and decision == self.VERIFIED:
                    decision = self.REVIEW_REQUIRED
                    reasons.append(
                        f"Reported energy deviates {gap_pct:.1f}% from ML estimate "
                        "— manual review required"
                    )
            else:
                if decision == self.VERIFIED:
                    decision = self.REVIEW_REQUIRED
                    reasons.append(
                        "Numeric inputs (E_gen, grid emission factor, efficiency) required "
                        "to calculate credits"
                    )

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
                "area_hectares": area_hectares,
                "formula_computed_credits": formula_computed_credits,
                "ml_estimated_credits": ml_estimated_credits,
                "cross_check_gap_pct": cross_check_gap_pct,
            },
            "explanation": explanation,
            "decision_reasons": reasons
        }

    def _verify_methane(
        self,
        user_metadata: Dict[str, Any],
        ai_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Methane / Biogas project verification logic."""
        project_name            = user_metadata.get("project_name", "Unknown")
        area_hectares           = user_metadata.get("project_area_hectares", 0.0)
        claimed_improvement     = user_metadata.get("claimed_improvement_pct", 0.0)
        biogas_volume           = user_metadata.get("biogas_volume_m3_year")
        methane_fraction_pct    = user_metadata.get("methane_fraction_pct", 60)
        plant_capacity_kw       = user_metadata.get("biogas_plant_capacity_kw")

        reasons = []
        decision = self.VERIFIED

        # STEP 1 — Reject if no data
        if not biogas_volume or float(biogas_volume) <= 0:
            return self._create_domain_result(
                project_name, "methane", self.REJECTED, 0.10, "LOW",
                {"area_hectares": area_hectares},
                "✗ PROJECT REJECTED\n\nBiogas volume is required to verify this project.",
                ["Biogas volume is required"]
            )

        biogas_volume = float(biogas_volume)
        methane_fraction_pct = int(methane_fraction_pct) if methane_fraction_pct else 60

        # STEP 2 — Compute CO2 equivalent
        ch4_volume_m3  = biogas_volume * (methane_fraction_pct / 100)
        ch4_mass_kg    = ch4_volume_m3 * 0.716
        co2_eq_kg      = ch4_mass_kg * 25  # GWP-100
        co2_eq_tonnes  = co2_eq_kg / 1000
        formula_credits = int(co2_eq_tonnes)

        # STEP 3 — Plausibility check vs. plant capacity
        if plant_capacity_kw and float(plant_capacity_kw) > 0:
            max_realistic_m3 = float(plant_capacity_kw) * 8760 * 0.3
            if biogas_volume > max_realistic_m3 * 2:
                decision = self.REVIEW_REQUIRED
                reasons.append(
                    "Reported biogas volume appears high relative to plant capacity"
                )

        # STEP 4 — Claim gap check
        claimed_co2_reduction = claimed_improvement * area_hectares * 10
        claim_gap_pct = abs(formula_credits - claimed_co2_reduction) / max(claimed_co2_reduction, 1) * 100

        if claim_gap_pct > 150:
            decision = self.REJECTED
            reasons.append(f"Claim gap {claim_gap_pct:.1f}% exceeds 150% threshold")
        elif claim_gap_pct > 50 and decision != self.REVIEW_REQUIRED:
            decision = self.REVIEW_REQUIRED
            reasons.append(f"Claim gap {claim_gap_pct:.1f}% requires manual review")
        elif decision == self.VERIFIED and not reasons:
            reasons.append("Methane project data is internally consistent")

        # STEP 5 — Confidence
        if decision == self.VERIFIED:
            confidence = 0.70
        elif decision == self.REVIEW_REQUIRED:
            confidence = 0.40
        else:
            confidence = 0.10

        # Claim alignment
        claim_alignment = "HIGH" if claim_gap_pct <= 15 else ("MEDIUM" if claim_gap_pct <= 50 else "LOW")

        # Explanation
        explanation = self._generate_generic_explanation(
            decision, reasons, "methane",
            f"Biogas: {biogas_volume:.0f} m³/year → CH4: {ch4_volume_m3:.0f} m³ → "
            f"CO₂ eq: {co2_eq_tonnes:.2f} tCO₂ → Credits: {formula_credits}"
        )

        return self._create_domain_result(
            project_name, "methane", decision, confidence, claim_alignment,
            {
                "biogas_volume_m3_year": biogas_volume,
                "methane_fraction_pct": methane_fraction_pct,
                "ch4_volume_m3": round(ch4_volume_m3, 2),
                "co2_equivalent_tonnes": round(co2_eq_tonnes, 2),
                "formula_computed_credits": formula_credits,
                "claim_gap_pct": round(claim_gap_pct, 2),
                "area_hectares": area_hectares,
            },
            explanation, reasons
        )

    def _verify_cookstove(
        self,
        user_metadata: Dict[str, Any],
        ai_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Cookstove / Improved Cooking Stove project verification logic."""
        project_name              = user_metadata.get("project_name", "Unknown")
        claimed_improvement       = user_metadata.get("claimed_improvement_pct", 0.0)
        stoves_count              = user_metadata.get("stoves_count")
        wood_saved_kg             = user_metadata.get("wood_saved_kg_per_stove_year")
        fnrb_scaled               = user_metadata.get("fnrb_scaled")
        emission_factor_scaled    = user_metadata.get("wood_emission_factor_scaled")
        efficiency_pct            = user_metadata.get("cookstove_efficiency_pct")
        has_images                = user_metadata.get("has_images", False)

        reasons = []
        decision = self.VERIFIED

        # STEP 1 — Reject if critical inputs missing
        if not stoves_count or int(stoves_count) <= 0:
            return self._create_domain_result(
                project_name, "cookstove", self.REJECTED, 0.10, "LOW",
                {},
                "✗ PROJECT REJECTED\n\nNumber of stoves is required.",
                ["Number of stoves is required"]
            )

        if not has_images:
            return self._create_domain_result(
                project_name, "cookstove", self.REJECTED, 0.10, "LOW",
                {"stoves_count": stoves_count},
                "✗ PROJECT REJECTED\n\nGeotagged photos of installed stoves are mandatory for cookstove verification.",
                ["Geotagged photos of installed stoves are mandatory for cookstove verification"]
            )

        stoves_count = int(stoves_count)

        # STEP 2 — Apply defaults for optional inputs
        n    = stoves_count
        dw   = int(wood_saved_kg)         if wood_saved_kg       else 2000
        fnrb = int(fnrb_scaled)           if fnrb_scaled         else 85
        ef   = int(emission_factor_scaled) if emission_factor_scaled else 150
        eff  = int(efficiency_pct)        if efficiency_pct      else 90

        # STEP 3 — Formula
        formula_credits = int((n * dw * fnrb * ef * eff) / (10 ** 9))

        # STEP 4 — Plausibility checks
        if dw > 5000:
            decision = self.REVIEW_REQUIRED
            reasons.append(
                "Wood saved per stove exceeds 5000 kg/year — implausible, manual review required"
            )
        if n > 1_000_000:
            if decision != self.REVIEW_REQUIRED:
                decision = self.REVIEW_REQUIRED
            reasons.append(
                "Stove count exceeds 1 million — unusually large, manual review required"
            )
        if fnrb > 100 or fnrb < 1:
            if decision != self.REVIEW_REQUIRED:
                decision = self.REVIEW_REQUIRED
            reasons.append("fNRB value must be between 1 and 100")

        # STEP 5 — Claim gap
        expected_credits_rough = n * 2.5
        claim_gap_pct = abs(formula_credits - expected_credits_rough) / max(expected_credits_rough, 1) * 100

        if claim_gap_pct > 150 and decision == self.VERIFIED:
            decision = self.REJECTED
        elif claim_gap_pct > 50 and decision == self.VERIFIED:
            decision = self.REVIEW_REQUIRED
        elif decision == self.VERIFIED:
            reasons.append(
                "Cookstove project data is internally consistent and photos are present"
            )

        # STEP 6 — Confidence
        if decision == self.VERIFIED:
            confidence = 0.75
        elif decision == self.REVIEW_REQUIRED:
            confidence = 0.45
        else:
            confidence = 0.10

        claim_alignment = "HIGH" if claim_gap_pct <= 15 else ("MEDIUM" if claim_gap_pct <= 50 else "LOW")

        explanation = self._generate_generic_explanation(
            decision, reasons, "cookstove",
            f"Stoves: {n} × Wood saved: {dw} kg × fNRB: {fnrb}% × EF: {ef} × Eff: {eff}% = {formula_credits} credits"
        )

        return self._create_domain_result(
            project_name, "cookstove", decision, confidence, claim_alignment,
            {
                "stoves_count": n,
                "wood_saved_kg_per_stove_year": dw,
                "fnrb_pct": fnrb,
                "emission_factor": ef,
                "efficiency_pct": eff,
                "formula_computed_credits": formula_credits,
                "claim_gap_pct": round(claim_gap_pct, 2),
                "photos_verified": has_images,
            },
            explanation, reasons
        )

    def _verify_wind(
        self,
        user_metadata: Dict[str, Any],
        ai_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Wind Energy project verification logic."""
        project_name            = user_metadata.get("project_name", "Unknown")
        area_hectares           = user_metadata.get("project_area_hectares", 0.0)
        claimed_improvement     = user_metadata.get("claimed_improvement_pct", 0.0)
        wind_kwh                = user_metadata.get("wind_energy_generated_kwh")
        ef_grid_raw             = user_metadata.get("wind_grid_emission_factor")
        efficiency_raw          = user_metadata.get("wind_turbine_efficiency_pct")
        turbine_count           = user_metadata.get("wind_turbine_count")

        reasons = []
        decision = self.VERIFIED

        # STEP 1 — Reject if no data
        if not wind_kwh or int(wind_kwh) <= 0:
            return self._create_domain_result(
                project_name, "wind", self.REJECTED, 0.10, "LOW",
                {"area_hectares": area_hectares},
                "✗ PROJECT REJECTED\n\nAnnual wind energy generation (kWh) is required.",
                ["Annual wind energy generation (kWh) is required"]
            )

        wind_kwh = int(wind_kwh)

        # STEP 2 — Apply defaults
        ef_grid    = int(ef_grid_raw)     if ef_grid_raw    else 715
        efficiency = int(efficiency_raw)  if efficiency_raw else 90

        # STEP 3 — Formula (same structure as solar)
        formula_credits = int((wind_kwh * ef_grid * efficiency) / (10 ** 8))

        # STEP 4 — Turbine plausibility check
        if turbine_count and int(turbine_count) > 0:
            tc = int(turbine_count)
            max_kwh_per_turbine = 2000 * 8760 * 0.40
            max_realistic_kwh = tc * max_kwh_per_turbine
            if wind_kwh > max_realistic_kwh:
                decision = self.REVIEW_REQUIRED
                reasons.append(
                    f"Reported generation exceeds theoretical maximum for {tc} turbines"
                )

        # STEP 5 — Claim gap
        claimed_co2_reduction = claimed_improvement * area_hectares * 10
        claim_gap_pct = abs(formula_credits - claimed_co2_reduction) / max(claimed_co2_reduction, 1) * 100

        if claim_gap_pct > 150 and decision == self.VERIFIED:
            decision = self.REJECTED
        elif claim_gap_pct > 50 and decision == self.VERIFIED:
            decision = self.REVIEW_REQUIRED
        elif decision == self.VERIFIED:
            reasons.append("Wind project data is internally consistent")

        # STEP 6 — Confidence
        if decision == self.VERIFIED:
            confidence = 0.70
        elif decision == self.REVIEW_REQUIRED:
            confidence = 0.40
        else:
            confidence = 0.10

        claim_alignment = "HIGH" if claim_gap_pct <= 15 else ("MEDIUM" if claim_gap_pct <= 50 else "LOW")

        explanation = self._generate_generic_explanation(
            decision, reasons, "wind",
            f"Energy: {wind_kwh:,} kWh × EF: {ef_grid} × Eff: {efficiency}% = {formula_credits} credits"
        )

        return self._create_domain_result(
            project_name, "wind", decision, confidence, claim_alignment,
            {
                "wind_energy_generated_kwh": wind_kwh,
                "grid_emission_factor": ef_grid,
                "efficiency_pct": efficiency,
                "turbine_count": turbine_count,
                "formula_computed_credits": formula_credits,
                "claim_gap_pct": round(claim_gap_pct, 2),
                "area_hectares": area_hectares,
            },
            explanation, reasons
        )

    # ── Shared helpers ─────────────────────────────────────────────────────

    def _create_domain_result(
        self,
        project_name: str,
        project_type: str,
        decision: str,
        confidence: float,
        claim_alignment: str,
        key_metrics: Dict[str, Any],
        explanation: str,
        reasons: List[str]
    ) -> Dict[str, Any]:
        """Build a standardised result dict for any domain."""
        return {
            "project_name": project_name,
            "project_type": project_type,
            "final_decision": decision,
            "confidence_score": round(confidence, 4),
            "claim_alignment": claim_alignment,
            "key_metrics": key_metrics,
            "explanation": explanation,
            "decision_reasons": reasons,
        }

    def _generate_generic_explanation(
        self,
        decision: str,
        reasons: List[str],
        domain: str,
        summary_line: str
    ) -> str:
        """Generate a human-readable explanation for formula-only domains."""
        domain_label = domain.upper()
        if decision == self.VERIFIED:
            header = f"✓ {domain_label} PROJECT VERIFIED"
            body   = f"The {domain} project has been verified based on the submitted data."
        elif decision == self.REVIEW_REQUIRED:
            header = f"⚠ {domain_label} PROJECT — REVIEW REQUIRED"
            body   = "The project requires manual review due to the following concerns:"
        else:
            header = f"✗ {domain_label} PROJECT REJECTED"
            body   = "The project does not meet minimum verification standards:"

        lines = [header, "", body, "", "CALCULATION SUMMARY:", f"• {summary_line}", "",
                 "DECISION RATIONALE:"]
        for r in reasons:
            lines.append(f"• {r}")
        return "\n".join(lines)

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
        
        if mean_iou < self.VEGETATION_IOU_REJECT_THRESHOLD:
            reasons.append(f"Mean IoU ({mean_iou:.4f}) below threshold ({self.VEGETATION_IOU_REJECT_THRESHOLD})")
            return self.REJECTED, reasons
        
        if temporal_consistency < self.TEMPORAL_CONSISTENCY_REVIEW_THRESHOLD:
            reasons.append(f"Temporal consistency ({temporal_consistency:.4f}) below threshold ({self.TEMPORAL_CONSISTENCY_REVIEW_THRESHOLD})")
            return self.REVIEW_REQUIRED, reasons
        
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
        
        if solar_probability < self.SOLAR_PROBABILITY_REJECT_THRESHOLD:
            reasons.append(f"Solar probability ({solar_probability:.4f}) below threshold ({self.SOLAR_PROBABILITY_REJECT_THRESHOLD})")
            return self.REJECTED, reasons
        
        if land_use_conflict:
            reasons.append("Land use conflict detected")
            return self.REVIEW_REQUIRED, reasons
        
        if claim_gap > self.CLAIM_GAP_REVIEW_THRESHOLD:
            reasons.append(f"Claim gap ({claim_gap:.2f}%) inconsistent with avoided CO2")
            return self.REVIEW_REQUIRED, reasons
        
        reasons.append("All verification criteria met")
        return self.VERIFIED, reasons
    
    def _detect_land_use_conflict(self, ai_outputs: Dict[str, Any]) -> bool:
        """Detect potential land use conflicts."""
        vegetation_detected = ai_outputs.get("mean_iou", 0) > 0.6
        solar_detected = ai_outputs.get("solar_probability", 0) > 0.5
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
