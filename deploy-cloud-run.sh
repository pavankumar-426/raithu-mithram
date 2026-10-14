#!/bin/bash
# ============================================================
# Google Cloud Run Deployment Script for Rythu Nestham (రైతు నేస్తం)
# ============================================================

set -e

PROJECT_ID=${1:-$(gcloud config get-value project 2>/dev/null)}
REGION="asia-south1"
SERVICE_NAME="rythu-nestham"

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo "Usage: ./deploy-cloud-run.sh <PROJECT_ID>"
    exit 1
fi

echo "============================================================"
echo "🌾 Deploying Rythu Nestham to Google Cloud Run"
echo "Project: $PROJECT_ID | Region: $REGION"
echo "============================================================"

# Set project
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo "Enabling Cloud Run & Cloud Build APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Deploy directly from source
echo "Building container in Cloud Build and deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1

echo "============================================================"
echo "Deployment Complete! Public URL generated successfully."
echo "============================================================"

