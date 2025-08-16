#!/bin/bash

# Signal Processor Deployment Script
set -e

# Configuration
PROJECT_ID="pipmaker-signals"
SERVICE_NAME="external-signal-processor"
REGION="asia-northeast3"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Starting Signal Processor deployment..."

# Check if gcloud is authenticated
if ! gcloud auth list --filter="status:ACTIVE" --format="value(account)" | grep -q "@"; then
    echo "❌ Please authenticate with gcloud: gcloud auth login"
    exit 1
fi

# Set the project
echo "📋 Setting project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo "🔧 Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and push the Docker image
echo "🏗️ Building Docker image..."
gcloud builds submit --tag ${IMAGE_NAME} .

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 5 \
    --min-instances 1 \
    --timeout 300s \
    --set-env-vars NODE_ENV=production \
    --set-env-vars LOG_LEVEL=info \
    --set-env-vars FIREBASE_PROJECT_ID=${PROJECT_ID}

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo "✅ Deployment completed!"
echo "🌐 Service URL: ${SERVICE_URL}"
echo "📊 Monitor logs: gcloud logs tail /projects/${PROJECT_ID}/logs/cloudrun.googleapis.com%2Fstderr"

# Test the deployment
echo "🧪 Testing deployment..."
if curl -f -s "${SERVICE_URL}/health" > /dev/null; then
    echo "✅ Health check passed!"
else
    echo "⚠️ Health check failed - service may still be starting up"
fi

echo "🎉 Signal Processor deployment complete!"