#!/bin/bash

#######################################
# Deploy Carrier Sales API to AWS EC2
#######################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
EC2_INSTANCE_TYPE="${EC2_INSTANCE_TYPE:-t3.small}"
KEY_NAME="${KEY_NAME:-carrier-api-key}"
SECURITY_GROUP_NAME="carrier-api-sg"
APP_NAME="carrier-sales-api"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Carrier Sales API - EC2 Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Install it from: https://docker.com/"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_REPOSITORY="${APP_NAME}"
IMAGE_TAG="latest"

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Step 1: Create ECR Repository (if it doesn't exist)
echo -e "${YELLOW}Step 1: Setting up ECR repository...${NC}"
if aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION} &> /dev/null; then
    echo "ECR repository already exists"
else
    echo "Creating ECR repository..."
    aws ecr create-repository \
        --repository-name ${ECR_REPOSITORY} \
        --region ${AWS_REGION} \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
    echo -e "${GREEN}✓ ECR repository created${NC}"
fi
echo ""

# Step 2: Build Docker image
echo -e "${YELLOW}Step 2: Building Docker image...${NC}"
docker build -t ${APP_NAME}:${IMAGE_TAG} .
echo -e "${GREEN}✓ Docker image built${NC}"
echo ""

# Step 3: Push to ECR
echo -e "${YELLOW}Step 3: Pushing image to ECR...${NC}"
echo "Logging in to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin ${ECR_REGISTRY}

echo "Tagging image..."
docker tag ${APP_NAME}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}

echo "Pushing image..."
docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
echo -e "${GREEN}✓ Image pushed to ECR${NC}"
echo ""

# Step 4: Create Security Group (if it doesn't exist)
echo -e "${YELLOW}Step 4: Setting up security group...${NC}"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region ${AWS_REGION})

if aws ec2 describe-security-groups --group-names ${SECURITY_GROUP_NAME} --region ${AWS_REGION} &> /dev/null; then
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --group-names ${SECURITY_GROUP_NAME} --query "SecurityGroups[0].GroupId" --output text --region ${AWS_REGION})
    echo "Security group already exists: ${SECURITY_GROUP_ID}"
else
    echo "Creating security group..."
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name ${SECURITY_GROUP_NAME} \
        --description "Security group for Carrier Sales API" \
        --vpc-id ${VPC_ID} \
        --region ${AWS_REGION} \
        --query 'GroupId' \
        --output text)
    
    # Allow HTTP traffic
    aws ec2 authorize-security-group-ingress \
        --group-id ${SECURITY_GROUP_ID} \
        --protocol tcp \
        --port 3000 \
        --cidr 0.0.0.0/0 \
        --region ${AWS_REGION}
    
    # Allow SSH traffic
    aws ec2 authorize-security-group-ingress \
        --group-id ${SECURITY_GROUP_ID} \
        --protocol tcp \
        --port 22 \
        --cidr 0.0.0.0/0 \
        --region ${AWS_REGION}
    
    echo -e "${GREEN}✓ Security group created: ${SECURITY_GROUP_ID}${NC}"
fi
echo ""

# Step 5: Create IAM Role for EC2 (if it doesn't exist)
echo -e "${YELLOW}Step 5: Setting up IAM role...${NC}"
ROLE_NAME="${APP_NAME}-ec2-role"

if aws iam get-role --role-name ${ROLE_NAME} &> /dev/null; then
    echo "IAM role already exists"
else
    echo "Creating IAM role..."
    
    # Create trust policy
    cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
    
    # Create role
    aws iam create-role \
        --role-name ${ROLE_NAME} \
        --assume-role-policy-document file:///tmp/trust-policy.json
    
    # Attach ECR read policy
    aws iam attach-role-policy \
        --role-name ${ROLE_NAME} \
        --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
    
    # Attach CloudWatch logs policy
    aws iam attach-role-policy \
        --role-name ${ROLE_NAME} \
        --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
    
    # Create instance profile
    aws iam create-instance-profile --instance-profile-name ${ROLE_NAME}-profile
    
    # Add role to instance profile
    aws iam add-role-to-instance-profile \
        --instance-profile-name ${ROLE_NAME}-profile \
        --role-name ${ROLE_NAME}
    
    echo "Waiting for IAM role to propagate..."
    sleep 10
    
    echo -e "${GREEN}✓ IAM role created${NC}"
fi
echo ""

# Step 6: Create user data script
echo -e "${YELLOW}Step 6: Preparing EC2 user data...${NC}"
cat > /tmp/user-data.sh <<EOF
#!/bin/bash
set -e

# Update system
yum update -y

# Install Docker
yum install -y docker
service docker start
usermod -a -G docker ec2-user

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Pull and run the container
docker pull ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}

docker run -d \
  --name ${APP_NAME} \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e LOG_LEVEL=info \
  ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}

echo "Carrier Sales API deployed successfully!"
EOF

echo -e "${GREEN}✓ User data prepared${NC}"
echo ""

# Step 7: Launch EC2 instance
echo -e "${YELLOW}Step 7: Launching EC2 instance...${NC}"

# Get latest Amazon Linux 2 AMI
AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text \
    --region ${AWS_REGION})

echo "Using AMI: ${AMI_ID}"

# Check if key pair exists
if ! aws ec2 describe-key-pairs --key-names ${KEY_NAME} --region ${AWS_REGION} &> /dev/null; then
    echo -e "${RED}Error: Key pair '${KEY_NAME}' not found${NC}"
    echo "Create a key pair with: aws ec2 create-key-pair --key-name ${KEY_NAME} --query 'KeyMaterial' --output text > ${KEY_NAME}.pem"
    exit 1
fi

# Launch instance
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ${AMI_ID} \
    --instance-type ${EC2_INSTANCE_TYPE} \
    --key-name ${KEY_NAME} \
    --security-group-ids ${SECURITY_GROUP_ID} \
    --iam-instance-profile Name=${ROLE_NAME}-profile \
    --user-data file:///tmp/user-data.sh \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${APP_NAME}},{Key=Application,Value=carrier-sales-api}]" \
    --region ${AWS_REGION} \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "Instance launched: ${INSTANCE_ID}"
echo "Waiting for instance to start..."

aws ec2 wait instance-running --instance-ids ${INSTANCE_ID} --region ${AWS_REGION}

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids ${INSTANCE_ID} \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text \
    --region ${AWS_REGION})

echo -e "${GREEN}✓ EC2 instance launched${NC}"
echo ""

# Cleanup temp files
rm -f /tmp/trust-policy.json /tmp/user-data.sh

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Instance ID: ${INSTANCE_ID}"
echo "Public IP: ${PUBLIC_IP}"
echo "Region: ${AWS_REGION}"
echo ""
echo "The API will be available at: http://${PUBLIC_IP}:3000"
echo ""
echo -e "${YELLOW}Note: It may take 2-3 minutes for the container to start${NC}"
echo ""
echo "Test the deployment:"
echo "  curl http://${PUBLIC_IP}:3000/health"
echo ""
echo "SSH into the instance:"
echo "  ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
echo ""
echo "View container logs:"
echo "  ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP} 'docker logs ${APP_NAME}'"
echo ""
echo -e "${YELLOW}Don't forget to terminate the instance when done:${NC}"
echo "  aws ec2 terminate-instances --instance-ids ${INSTANCE_ID} --region ${AWS_REGION}"
echo ""

