#!/bin/bash

# AmazeBid Hybrid Deployment Script
# This script helps deploy the backend to VPS

set -e

echo "🚀 AmazeBid Hybrid Deployment Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if .env.production exists
if [ ! -f .env.production ]; then
    print_error ".env.production file not found!"
    echo "Please create .env.production file with your environment variables."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed!"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

print_success "Docker is installed"

# Build Docker image
echo ""
echo "📦 Building Docker image..."
docker build -t amazebid-api:latest .

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully"
else
    print_error "Docker image build failed"
    exit 1
fi

# Stop existing container if running
echo ""
echo "🛑 Stopping existing container (if running)..."
if docker ps -a | grep -q amazebid-api; then
    docker stop amazebid-api
    docker rm amazebid-api
    print_success "Existing container stopped and removed"
else
    print_warning "No existing container found"
fi

# Run new container
echo ""
echo "🚀 Starting new container..."
docker run -d \
    --name amazebid-api \
    --restart unless-stopped \
    -p 3000:3000 \
    --env-file .env.production \
    amazebid-api:latest

if [ $? -eq 0 ]; then
    print_success "Container started successfully"
else
    print_error "Failed to start container"
    exit 1
fi

# Wait for container to be ready
echo ""
echo "⏳ Waiting for container to be ready..."
sleep 5

# Check container status
if docker ps | grep -q amazebid-api; then
    print_success "Container is running"
    echo ""
    echo "📊 Container Status:"
    docker ps --filter "name=amazebid-api"
else
    print_error "Container is not running"
    echo ""
    echo "📋 Container Logs:"
    docker logs amazebid-api
    exit 1
fi

# Test API health endpoint
echo ""
echo "🔍 Testing API health endpoint..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "API health check passed"
else
    print_warning "API health check failed (this might be normal if using different port)"
fi

echo ""
echo "✨ Deployment completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Configure Nginx reverse proxy (see HYBRID_DEPLOYMENT_GUIDE.md)"
echo "2. Setup SSL certificate with Certbot"
echo "3. Configure DNS records in Squarespace (see DNS_SETUP_GUIDE.md)"
echo "4. Deploy frontend to Vercel"
echo ""
echo "🔧 Useful commands:"
echo "  View logs: docker logs -f amazebid-api"
echo "  Stop container: docker stop amazebid-api"
echo "  Restart container: docker restart amazebid-api"
echo "  Remove container: docker rm -f amazebid-api"
echo ""
