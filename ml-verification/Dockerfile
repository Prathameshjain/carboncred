# =========================================
# CarbonCred - ML Verification Dockerfile
# =========================================
# TensorFlow service with baked-in model checkpoints

FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ML_PORT=5001

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Use a separate requirements file for ML
COPY requirements.txt /app/ml-requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r /app/ml-requirements.txt && \
    pip install --no-cache-dir flask==3.0.3

# Copy ML source code (includes models/checkpoints)
COPY src/ /app/src/

# Copy the Flask API wrapper
COPY api.py /app/api.py

# Expose ML API port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

CMD ["python", "api.py"]
