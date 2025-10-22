# Scripts Directory

This directory contains various scripts for managing the application locally and on EC2.

## Setup for Deployment Scripts

The deployment scripts require your FMCSA API key. Before using them:

1. **Copy the template files:**
   ```bash
   cp scripts/update-ec2.sh.template scripts/update-ec2.sh
   cp scripts/deploy-to-ec2.sh.template scripts/deploy-to-ec2.sh
   ```

2. **Add execute permissions:**
   ```bash
   chmod +x scripts/update-ec2.sh
   chmod +x scripts/deploy-to-ec2.sh
   ```

3. **Edit both files and replace `YOUR_FMCSA_API_KEY_HERE` with your actual API key**

> ⚠️ **Note:** The actual scripts (without `.template`) are gitignored to prevent accidentally committing API keys.

## Local Database Management

Run these with `npm run <script-name>`:

- **`clear-db`** - Clears entire database including API keys
- **`clear-db-keep-keys`** - Clears loads, carriers, and assignments but preserves API keys
- **`load-mock-data`** - Loads mock loads from `data/mock-loads.json`
- **`load-mock-carriers`** - Loads mock carriers from `data/mock-carriers.json`

## API Key Management

- **`generate-api-key.js`** - Generate a new API key
- **`list-api-keys.js`** - List all API keys
- **`revoke-api-key.js`** - Revoke an API key

## EC2 Deployment

### Initial Deployment

```bash
./scripts/deploy-to-ec2.sh
```

Creates a new EC2 instance and deploys the application.

### Update Existing Instance

```bash
./scripts/update-ec2.sh
```

Builds and deploys the latest code to your existing EC2 instance.

### EC2 Data Management

```bash
# Clear data (preserves API keys)
EC2_HOST=<your-ec2-ip> ./scripts/ec2-manage-data.sh clear

# Load mock data
EC2_HOST=<your-ec2-ip> ./scripts/ec2-manage-data.sh load

# Check database status
EC2_HOST=<your-ec2-ip> ./scripts/ec2-manage-data.sh status
```

**Environment Variables:**
- `EC2_HOST` - EC2 instance IP or hostname (required, or auto-detected via AWS CLI)
- `KEY_NAME` - SSH key name (default: carrier-api-key)
- `KEY_PATH` - Path to SSH key file (default: auto-detected)
- `AWS_REGION` - AWS region (default: us-east-1)

