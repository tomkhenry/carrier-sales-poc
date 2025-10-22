#!/bin/bash

#######################################
# EC2 Data Management Script (Development Only)
# Manages carrier and load data on remote EC2 instance
#######################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
KEY_NAME="${KEY_NAME:-carrier-api-key}"
EC2_USER="ec2-user"
CONTAINER_NAME="carrier-sales-api"
REMOTE_DATA_PATH="/app/data/db.json"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Function to print usage
print_usage() {
    echo -e "${BLUE}Usage:${NC}"
    echo "  $0 clear   - Clear carriers, loads, and assignments (keeps API keys)"
    echo "  $0 load    - Load mock loads data (preserves carriers, assignments, and API keys)"
    echo "  $0 status  - Show database status"
    echo ""
    echo -e "${BLUE}Environment Variables:${NC}"
    echo "  EC2_HOST    - EC2 instance public IP or hostname (required)"
    echo "  KEY_NAME    - SSH key name (default: carrier-api-key)"
    echo "  KEY_PATH    - Path to SSH key file (default: ./{KEY_NAME}.pem)"
    echo "  AWS_REGION  - AWS region (default: us-east-1)"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  EC2_HOST=3.87.123.45 ./scripts/ec2-manage-data.sh clear"
    echo "  EC2_HOST=ec2-3-87-123-45.compute-1.amazonaws.com KEY_PATH=~/.ssh/my-key.pem ./scripts/ec2-manage-data.sh load"
    exit 1
}

# Function to get EC2 instance IP
get_ec2_ip() {
    if [ -z "$EC2_HOST" ]; then
        echo -e "${YELLOW}Looking up EC2 instance...${NC}"
        
        # Try to find running instance with the app tag
        INSTANCE_ID=$(aws ec2 describe-instances \
            --region ${AWS_REGION} \
            --filters "Name=tag:Application,Values=carrier-sales-api" \
                      "Name=instance-state-name,Values=running" \
            --query 'Reservations[0].Instances[0].InstanceId' \
            --output text 2>/dev/null)
        
        if [ "$INSTANCE_ID" = "None" ] || [ -z "$INSTANCE_ID" ]; then
            echo -e "${RED}Error: No running EC2 instance found with tag 'Application=carrier-sales-api'${NC}"
            echo "Please set EC2_HOST environment variable:"
            echo "  EC2_HOST=<your-ec2-ip> $0 $1"
            exit 1
        fi
        
        EC2_HOST=$(aws ec2 describe-instances \
            --instance-ids ${INSTANCE_ID} \
            --region ${AWS_REGION} \
            --query 'Reservations[0].Instances[0].PublicIpAddress' \
            --output text)
        
        echo -e "${GREEN}Found EC2 instance: ${INSTANCE_ID} (${EC2_HOST})${NC}"
    fi
}

# Function to check SSH key
check_ssh_key() {
    if [ -z "$KEY_PATH" ]; then
        # Try common locations
        if [ -f "${KEY_NAME}.pem" ]; then
            KEY_PATH="${KEY_NAME}.pem"
        elif [ -f "${PROJECT_ROOT}/${KEY_NAME}.pem" ]; then
            KEY_PATH="${PROJECT_ROOT}/${KEY_NAME}.pem"
        elif [ -f "$HOME/.ssh/${KEY_NAME}.pem" ]; then
            KEY_PATH="$HOME/.ssh/${KEY_NAME}.pem"
        else
            echo -e "${RED}Error: SSH key not found${NC}"
            echo "Looked in:"
            echo "  ./${KEY_NAME}.pem"
            echo "  ${PROJECT_ROOT}/${KEY_NAME}.pem"
            echo "  $HOME/.ssh/${KEY_NAME}.pem"
            echo ""
            echo "Please specify KEY_PATH:"
            echo "  KEY_PATH=/path/to/key.pem $0 $1"
            exit 1
        fi
    fi
    
    if [ ! -f "$KEY_PATH" ]; then
        echo -e "${RED}Error: SSH key file not found: ${KEY_PATH}${NC}"
        exit 1
    fi
    
    # Check key permissions
    KEY_PERMS=$(stat -f "%OLp" "$KEY_PATH" 2>/dev/null || stat -c "%a" "$KEY_PATH" 2>/dev/null)
    if [ "$KEY_PERMS" != "400" ] && [ "$KEY_PERMS" != "600" ]; then
        echo -e "${YELLOW}Warning: SSH key has incorrect permissions${NC}"
        echo "Fixing permissions: chmod 400 ${KEY_PATH}"
        chmod 400 "$KEY_PATH"
    fi
}

# Function to execute command in Docker container on EC2
exec_remote() {
    local cmd="$1"
    ssh -i "$KEY_PATH" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o LogLevel=ERROR \
        "${EC2_USER}@${EC2_HOST}" \
        "docker exec ${CONTAINER_NAME} sh -c \"${cmd}\""
}

# Function to get current database
get_remote_db() {
    exec_remote "cat ${REMOTE_DATA_PATH}"
}

# Function to clear data (preserve API keys)
clear_data() {
    echo -e "${YELLOW}Clearing carrier, load, and assignment data...${NC}"
    
    # Execute the clear script in the container
    echo "Running clear-db-preserve-keys script in container..."
    exec_remote "node scripts/clear-db-preserve-keys.js"
    
    echo ""
    
    # Show status
    show_status
}

# Function to load mock data
load_data() {
    echo -e "${YELLOW}Loading mock loads data...${NC}"
    
    # Execute the load-mock-data script in the container
    echo "Running load-mock-data script in container..."
    exec_remote "node scripts/load-mock-data.js"
    
    echo ""
    echo -e "${GREEN}✅ Mock loads loaded successfully!${NC}"
    echo ""
    
    # Show status
    show_status
}

# Function to show database status
show_status() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Database Status${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    # Get database
    DB=$(get_remote_db)
    
    if command -v jq &> /dev/null; then
        LOADS_COUNT=$(echo "$DB" | jq '.loads | length')
        CARRIERS_COUNT=$(echo "$DB" | jq '.carriers | length')
        ASSIGNMENTS_COUNT=$(echo "$DB" | jq '.assignments // [] | length')
        API_KEYS_COUNT=$(echo "$DB" | jq '.apiKeys // [] | length')
        
        echo -e "${GREEN}📦 Loads:        ${LOADS_COUNT}${NC}"
        echo -e "${GREEN}🚚 Carriers:     ${CARRIERS_COUNT}${NC}"
        echo -e "${GREEN}🔗 Assignments:  ${ASSIGNMENTS_COUNT}${NC}"
        echo -e "${GREEN}🔑 API Keys:     ${API_KEYS_COUNT}${NC}"
        
        # Show some sample data
        if [ "$LOADS_COUNT" -gt 0 ]; then
            echo ""
            echo -e "${BLUE}Sample Loads:${NC}"
            echo "$DB" | jq -r '.loads[0:3] | .[] | "  \(.load_id): \(.origin) → \(.destination) (\(.equipment_type))"'
        fi
        
        if [ "$CARRIERS_COUNT" -gt 0 ]; then
            echo ""
            echo -e "${BLUE}Sample Carriers:${NC}"
            echo "$DB" | jq -r '.carriers[0:3] | .[] | "  MC-\(.mc_number): \(.legal_name)"'
        fi
        
        if [ "$API_KEYS_COUNT" -gt 0 ]; then
            echo ""
            echo -e "${BLUE}API Keys:${NC}"
            echo "$DB" | jq -r '.apiKeys[] | "  \(.name): \(.key[0:20])... (Active: \(.isActive))"'
        fi
    else
        # Fallback without jq
        echo -e "${YELLOW}Note: Install jq for detailed statistics${NC}"
        echo ""
        echo "Raw database:"
        echo "$DB" | head -50
        echo "..."
    fi
    
    echo ""
    echo -e "${BLUE}========================================${NC}"
}

# Main script
main() {
    if [ $# -eq 0 ]; then
        print_usage
    fi
    
    COMMAND=$1
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}EC2 Data Management${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    # Get EC2 instance
    get_ec2_ip
    
    # Check SSH key
    check_ssh_key
    
    echo -e "${BLUE}Configuration:${NC}"
    echo "  EC2 Host:   ${EC2_HOST}"
    echo "  SSH Key:    ${KEY_PATH}"
    echo "  Container:  ${CONTAINER_NAME}"
    echo ""
    
    # Check if container is running
    echo "Checking Docker container..."
    if ! ssh -i "$KEY_PATH" \
            -o StrictHostKeyChecking=no \
            -o UserKnownHostsFile=/dev/null \
            -o LogLevel=ERROR \
            "${EC2_USER}@${EC2_HOST}" \
            "docker ps --filter name=${CONTAINER_NAME} --filter status=running -q" | grep -q .; then
        echo -e "${RED}Error: Container '${CONTAINER_NAME}' is not running on EC2${NC}"
        echo "Check container status with:"
        echo "  ssh -i ${KEY_PATH} ${EC2_USER}@${EC2_HOST} 'docker ps -a'"
        exit 1
    fi
    echo -e "${GREEN}✓ Container is running${NC}"
    echo ""
    
    # Execute command
    case "$COMMAND" in
        clear)
            clear_data
            ;;
        load)
            load_data
            ;;
        status)
            show_status
            ;;
        *)
            echo -e "${RED}Error: Unknown command '$COMMAND'${NC}"
            echo ""
            print_usage
            ;;
    esac
}

# Run main function
main "$@"

