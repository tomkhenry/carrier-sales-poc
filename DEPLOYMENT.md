# Deployment Guide

Deploy the Carrier Sales API to AWS EC2 in minutes using our automated scripts.

## Quick Start

**First deployment:**
```bash
# 1. Configure your API key (one-time setup)
cp scripts/deploy-to-ec2.sh.template scripts/deploy-to-ec2.sh
cp scripts/update-ec2.sh.template scripts/update-ec2.sh
chmod +x scripts/*.sh
# Edit both scripts and replace YOUR_FMCSA_API_KEY_HERE with your actual key

# 2. Deploy
./scripts/deploy-to-ec2.sh
```

**Update existing deployment:**
```bash
./scripts/update-ec2.sh
```

That's it! The scripts handle everything automatically.

---

## Prerequisites

Ensure you have these installed and configured:

- **AWS CLI** configured (`aws configure`)
- **Docker** installed locally  
- **FMCSA API Key** for carrier verification
- **SSH Key Pair** in AWS EC2 (default name: `carrier-api-key`)

**Don't have an SSH key pair?**
```bash
aws ec2 create-key-pair --key-name carrier-api-key \
  --query 'KeyMaterial' --output text > carrier-api-key.pem
chmod 400 carrier-api-key.pem
```

## Initial Setup (One-Time)

### Configure Your API Key

```bash
# 1. Copy template files
cp scripts/deploy-to-ec2.sh.template scripts/deploy-to-ec2.sh
cp scripts/update-ec2.sh.template scripts/update-ec2.sh
chmod +x scripts/*.sh

# 2. Edit both scripts and replace YOUR_FMCSA_API_KEY_HERE with your actual key
#    - Line 216 in deploy-to-ec2.sh
#    - Line 167 in update-ec2.sh
```

> 🔒 **Note:** These scripts are `.gitignore`d to protect your API key.

### Optional: Customize Deployment

Set these environment variables to customize your deployment:

```bash
export AWS_REGION=us-east-1              # Default: us-east-1
export EC2_INSTANCE_TYPE=t3.small        # Default: t3.small
export KEY_NAME=carrier-api-key          # Default: carrier-api-key
```

---

## Deployment Scripts

### 🚀 First Time Deployment

```bash
./scripts/deploy-to-ec2.sh
```

This script automatically:
- ✅ Creates ECR repository
- ✅ Builds and pushes Docker image
- ✅ Sets up security groups and IAM roles
- ✅ Launches EC2 instance (t3.small)
- ✅ Installs and starts the container

**Output:**
```
Deployment Complete!
Instance ID: i-0123456789abcdef0
Public IP: 3.87.123.45
API URL: http://3.87.123.45:3000
```

Wait 2-3 minutes for the container to start, then test:
```bash
curl http://3.87.123.45:3000/health
```

### 🔄 Update Existing Deployment

```bash
./scripts/update-ec2.sh
```

Builds your latest code and deploys it to EC2. The script auto-detects your instance or you can specify:

```bash
EC2_HOST=3.87.123.45 KEY_PATH=~/my-key.pem ./scripts/update-ec2.sh
```

---

## Managing Your Deployment

### Find Your Instance

```bash
aws ec2 describe-instances \
  --filters "Name=tag:Application,Values=carrier-sales-api" \
            "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].[InstanceId,PublicIpAddress]' \
  --output table
```

### View Logs

```bash
# From your local machine
ssh -i carrier-api-key.pem ec2-user@<EC2_IP> 'docker logs -f carrier-sales-api'

# Or SSH in first
ssh -i carrier-api-key.pem ec2-user@<EC2_IP>
docker logs -f carrier-sales-api
```

### 📊 Manage Data on EC2

Use the `ec2-manage-data.sh` script to manage your production database:

```bash
# Check database status
EC2_HOST=<ec2-ip> ./scripts/ec2-manage-data.sh status

# Clear data (keeps API keys)
EC2_HOST=<ec2-ip> ./scripts/ec2-manage-data.sh clear

# Load mock data for testing
EC2_HOST=<ec2-ip> ./scripts/ec2-manage-data.sh load
```

The script auto-detects your instance if you have AWS CLI configured.

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | - | Set to `production` |
| `PORT` | Yes | 3000 | API server port |
| `FMCSA_API_KEY` | Yes | - | Your FMCSA API key |
| `LOG_LEVEL` | No | info | `debug`, `info`, `warn`, `error` |

### AWS Resources Created

The deployment script creates:
- **ECR Repository**: `carrier-sales-api`
- **Security Group**: `carrier-api-sg` (ports 3000, 22)
- **IAM Role**: `carrier-sales-api-ec2-role`
- **EC2 Instance**: `t3.small` with tag `Application=carrier-sales-api`


Common issues: Missing `FMCSA_API_KEY`, port 3000 in use, or incorrect image path.

### API Not Responding

```bash
# Test from EC2
curl http://localhost:3000/health

# Test from local
curl http://<EC2_IP>:3000/health
```

If local works but remote doesn't, check security group allows port 3000:
```bash
aws ec2 describe-security-groups --group-names carrier-api-sg
```

### Cannot Pull from ECR

Re-authenticate on EC2:
```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com
```

### Update Script Can't Find Instance

Manually specify the instance:
```bash
EC2_HOST=<your-ip> KEY_PATH=<your-key.pem> ./scripts/update-ec2.sh
```

---

## Cleanup

To terminate the deployment and delete all resources:

```bash
# Terminate instance
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Application,Values=carrier-sales-api" \
            "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)
aws ec2 terminate-instances --instance-ids ${INSTANCE_ID}

# Wait for termination, then clean up
aws ec2 wait instance-terminated --instance-ids ${INSTANCE_ID}
aws ec2 delete-security-group --group-name carrier-api-sg
aws ecr delete-repository --repository-name carrier-sales-api --force
```

Delete IAM role manually in AWS Console or see [detailed cleanup steps](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_manage_delete.html).

---

## Quick Reference

```bash
# Deploy
./scripts/deploy-to-ec2.sh

# Update
./scripts/update-ec2.sh

# Manage data
EC2_HOST=<ip> ./scripts/ec2-manage-data.sh status|clear|load

# View logs
ssh -i carrier-api-key.pem ec2-user@<IP> 'docker logs -f carrier-sales-api'

# Find instance
aws ec2 describe-instances \
  --filters "Name=tag:Application,Values=carrier-sales-api" \
            "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].[InstanceId,PublicIpAddress]' \
  --output table
```

---

## Additional Resources

- [README - Main Documentation](./README.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Scripts Documentation](./scripts/README.md)

