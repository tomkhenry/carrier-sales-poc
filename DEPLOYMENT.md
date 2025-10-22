# Deployment Guide

This guide covers deploying the Carrier Sales API to AWS EC2 using Docker images from Amazon ECR.

## Prerequisites

- AWS CLI configured (`aws configure`)
- Docker installed locally
- ECR repository created
- EC2 instance running with Docker installed

## Automated Deployment

Use the automated script for quick deployment:

```bash
./scripts/deploy-to-ec2.sh
```

This script will:
- Create ECR repository (if needed)
- Build your Docker image
- Push to ECR
- Set up security groups and IAM roles
- Launch and configure an EC2 instance
- Pull and run the container automatically

## Manual Deployment

If your ECR repository and EC2 instance are already set up, follow these steps to deploy updates:

### 1. Build and Push to ECR

Build your Docker image locally and push it to Amazon ECR:

```bash
# Set your AWS variables
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPOSITORY=carrier-sales-api

# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build the image
docker build -t carrier-sales-api:latest .

# Tag for ECR
docker tag carrier-sales-api:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest

# Push to ECR
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest
```

### 2. Pull and Run on EC2

SSH into your EC2 instance and pull the latest image:

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>

# Set AWS variables on EC2
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=<your-account-id>
export ECR_REPOSITORY=carrier-sales-api

# Login to ECR from EC2
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Pull the latest image
docker pull ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest

# Stop and remove old container (if running)
docker stop carrier-sales-api 2>/dev/null || true
docker rm carrier-sales-api 2>/dev/null || true

# Run the new container with FMCSA API key
docker run -d \
  --name carrier-sales-api \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e LOG_LEVEL=info \
  -e FMCSA_API_KEY=<your-fmcsa-api-key> \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest
```

**Important:** Replace `<your-fmcsa-api-key>` with your actual FMCSA API key. Never commit this key to version control.

### 3. Verify Deployment

Test that the API is running:

```bash
# From your local machine
curl http://<EC2_PUBLIC_IP>:3000/health

# Expected response:
# {
#   "success": true,
#   "message": "Inbound Carrier Sales Automation API is running",
#   "timestamp": "...",
#   "environment": "production"
# }
```

## Environment Variables

When running the container, you can configure these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Yes | API port (default: 3000) |
| `FMCSA_API_KEY` | Yes | Your FMCSA API key for carrier verification |
| `LOG_LEVEL` | No | Logging level: debug, info, warn, error (default: info) |
| `FMCSA_API_BASE_URL` | No | FMCSA API endpoint (default: https://mobile.fmcsa.dot.gov/qc/services/carriers) |
| `FMCSA_API_TIMEOUT` | No | API timeout in ms (default: 10000) |
| `CARRIER_CACHE_TTL` | No | Cache duration in seconds (default: 86400) |

## Viewing Logs

Check container logs on your EC2 instance:

```bash
# View logs
docker logs carrier-sales-api

# Follow logs in real-time
docker logs -f carrier-sales-api

# View last 100 lines
docker logs --tail 100 carrier-sales-api
```

## Managing the Container

Common Docker commands for managing your deployment:

```bash
# Check container status
docker ps

# Stop the container
docker stop carrier-sales-api

# Start the container
docker start carrier-sales-api

# Restart the container
docker restart carrier-sales-api

# Remove the container
docker rm carrier-sales-api

# View container resource usage
docker stats carrier-sales-api
```

## Troubleshooting

### Container won't start

Check the logs for errors:
```bash
docker logs carrier-sales-api
```

Common issues:
- Missing FMCSA_API_KEY environment variable
- Port 3000 already in use
- Incorrect ECR image path

### Cannot pull from ECR

Ensure your EC2 instance has the correct IAM role with `AmazonEC2ContainerRegistryReadOnly` policy attached.

Re-authenticate with ECR:
```bash
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
```

### API not responding

Check if the container is running:
```bash
docker ps | grep carrier-sales-api
```

Check security group allows inbound traffic on port 3000.

Test locally on EC2:
```bash
curl http://localhost:3000/health
```

## Quick Reference

**Update deployment:**
```bash
# Local: Build and push
docker build -t carrier-sales-api:latest .
docker tag carrier-sales-api:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest

# EC2: Pull and restart
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>
docker pull ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest
docker stop carrier-sales-api && docker rm carrier-sales-api
docker run -d --name carrier-sales-api --restart unless-stopped -p 3000:3000 \
  -e NODE_ENV=production -e PORT=3000 -e FMCSA_API_KEY=<your-key> \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest
```

## Additional Resources

- [Main Documentation](./README.md)
- [Docker Documentation](https://docs.docker.com/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)

