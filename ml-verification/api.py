#!/usr/bin/env python3
"""
CarbonCred ML Verification — HTTP API
======================================
Flask wrapper that exposes the CarbonCredVerificationEngine as a REST API.
Used internally by the Django backend to run ML-based project verification.

Endpoints:
  GET  /health          → Health check
  POST /verify          → Run verification (JSON body: {user_metadata, ai_outputs})
  POST /verify/batch    → Batch verification (JSON body: [{user_metadata, ai_outputs}, ...])
"""

import os
import sys
import json
import logging
from flask import Flask, request, jsonify

# Add src to path (models, engine, etc.)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "src"))

from verification_engine import CarbonCredVerificationEngine

# ── Logging ──────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ── Flask App ─────────────────────────────────────────────────────
app = Flask(__name__)

# ── Initialise Engine (shared across requests) ────────────────────
logger.info("Initialising CarbonCredVerificationEngine...")
engine = CarbonCredVerificationEngine()
logger.info("Engine ready.")


# ── Routes ────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Health-check endpoint for Docker healthcheck."""
    return jsonify({"status": "ok", "service": "carboncred-ml"}), 200


@app.route("/verify", methods=["POST"])
def verify():
    """
    Run verification for a single project.

    Request body (JSON):
        {
            "user_metadata": { ... },
            "ai_outputs":    { ... }
        }

    Response:
        { "success": true, "result": { ... } }
    """
    try:
        payload = request.get_json(force=True)

        if not payload:
            return jsonify({"success": False, "error": "Empty request body"}), 400

        user_metadata = payload.get("user_metadata")
        ai_outputs    = payload.get("ai_outputs", {})

        if not user_metadata:
            return jsonify({"success": False, "error": "user_metadata is required"}), 400

        logger.info(
            "Verifying project: %s (type=%s)",
            user_metadata.get("project_name", "unknown"),
            user_metadata.get("project_type", "unknown"),
        )

        result = engine.verify(
            user_metadata=user_metadata,
            ai_outputs=ai_outputs,
        )

        logger.info("Decision: %s | Confidence: %.2f", result["final_decision"], result["confidence_score"])

        return jsonify({"success": True, "result": result}), 200

    except Exception as exc:
        logger.exception("Verification failed: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@app.route("/verify/batch", methods=["POST"])
def verify_batch():
    """
    Run verification for multiple projects in one call.

    Request body (JSON):
        [
            {"user_metadata": {...}, "ai_outputs": {...}},
            ...
        ]
    """
    try:
        payload = request.get_json(force=True)

        if not isinstance(payload, list):
            return jsonify({"success": False, "error": "Expected a JSON array"}), 400

        results = []
        for item in payload:
            try:
                r = engine.verify(
                    user_metadata=item.get("user_metadata", {}),
                    ai_outputs=item.get("ai_outputs", {}),
                )
                results.append({"success": True, "result": r})
            except Exception as exc:
                results.append({"success": False, "error": str(exc)})

        return jsonify(results), 200

    except Exception as exc:
        logger.exception("Batch verification failed: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


# ── Main ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    logger.info("Starting ML API on port %s...", port)
    app.run(host="0.0.0.0", port=port, debug=False)
