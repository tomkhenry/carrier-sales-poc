# Inbound Carrier Sales Automation API

Express.js API for matching freight loads with carriers based on FMCSA data and carrier capabilities.

## Overview

This POC API determines which loads best fit a carrier given carrier and load information. It acts as a freight broker API to decide which loads fit the inquiring carrier.

### Key Features

- ✅ **Carrier Verification**: Validate carriers against FMCSA API (MC→DOT lookup, authority, operation classification)
- ✅ **Load Matching**: Match carriers with loads using FMCSA cargo data and intelligent algorithms
- ✅ **Analytics Dashboard**: Modern React-based dashboard for business insights and performance tracking
- ✅ **Caching**: 24-hour cache for carrier data to minimize API calls
- ✅ **File-based Storage**: Uses lowdb for rapid POC development

## Project Structure

```
InboundCarrierSalesAutomation/
├── src/                    # Backend (TypeScript)
│   ├── api/               # Routes, controllers, middleware
│   ├── services/          # Business logic (FMCSA, carriers, loads, metrics)
│   ├── models/            # DTOs and entities
│   ├── utils/             # Helpers (storage, matching, validation)
│   └── config/            # Configuration files
│
├── frontend/              # React Dashboard (TypeScript)
│   ├── src/
│   │   ├── components/   # Dashboard, Sidebar, metrics views
│   │   ├── services/     # API integration
│   │   └── types/        # TypeScript interfaces
│   └── dist/             # Build output
│
├── data/                  # lowdb storage & mock data
├── scripts/               # Utility scripts (API keys, deployment, mock data)
└── dist/                  # Production build (backend + frontend)
```

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   cd /path/to/InboundCarrierSalesAutomation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env if needed (default settings should work)
   ```

4. **Verify data directory**
   ```bash
   # data/db.json should already exist with empty collections
   cat data/db.json
   ```

## Running the Application

### Development Mode

**Backend only:**
```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot-reload enabled.

**With Dashboard (Development):**

Terminal 1 - Start backend:
```bash
npm run dev
```

Terminal 2 - Start frontend dev server:
```bash
cd frontend
npm run dev
```

Frontend dev server runs on `http://localhost:5173` with proxy to backend API.

### Production Mode

**Build everything:**
```bash
npm run build
```

This will:
1. Compile TypeScript backend to `dist/`
2. Build React frontend with Vite
3. Copy frontend build to `dist/public/`

**Start production server:**
```bash
npm start
```

Access the dashboard at `http://localhost:3000/dashboard`

### Docker

Run the API using Docker for consistent deployments:

#### Quick Start with Docker Compose
```bash
# Build and start the container
npm run docker:dev

# Or manually
docker-compose up --build
```

#### Build and Run Docker Image
```bash
# Build the Docker image
npm run docker:build

# Run the container
npm run docker:run
```

#### Using Docker Commands Directly
```bash
# Build
docker build -t carrier-sales-api:latest .

# Run with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  carrier-sales-api:latest
```

**📖 For complete deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### AWS EC2 Deployment

This API is designed to be deployed on AWS EC2 using Docker images from Amazon ECR.

**Quick Deploy (Automated):**
```bash
./scripts/deploy-to-ec2.sh
```

**Architecture:**
- Docker image stored in Amazon ECR (Elastic Container Registry)
- Deployed to EC2 instance with Docker
- Auto-restart on container failure

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

## API Authentication

All API endpoints require authentication using API keys. API keys are managed locally in `data/db.json`.

### Generate an API Key

```bash
node scripts/generate-api-key.js
```

Example output:
```
✅ API key created successfully!
🔑 API Key: ics_live_xxxxxxxxxxxx
📝 Name: Production API Key
📅 Created: 2025-10-22T01:33:02.397Z
```

### Use the API Key

Include the API key in your requests using either:

**Header (recommended):**
```bash
curl -H "X-API-Key: ics_live_xxxxxxxxxxxxx" \
  http://localhost:3000/api/carrier/verify-carrier
```

**Authorization Bearer:**
```bash
curl -H "Authorization: Bearer ics_live_xxxxxxxxxxxxx" \
  http://localhost:3000/api/carrier/verify-carrier
```

### Manage API Keys

```bash
# List all API keys
node scripts/list-api-keys.js

# Revoke an API key
node scripts/revoke-api-key.js
```

## Frontend Dashboard

Modern React-based analytics dashboard for monitoring carrier sales performance and load matching efficiency.

### Quick Start

**Development:**
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
# Access at http://localhost:5173
```

**Production:**
```bash
npm run build && npm start
# Access at http://localhost:3000/dashboard
```

### Dashboard Features

**Four Main Views:**
- 📊 **Overview** - System health, activity feed, key metrics
- ✓ **Carrier Validation** - Success rates, response times, failure analysis
- ⇄ **Load Matching** - Match rates, distance analytics, geographic distribution
- $ **Business Impact** - Cost savings, ROI metrics, efficiency gains

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Recharts (charts)

**Development:**
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Dev server (port 5173)
npm run build        # Production build
```

**Metrics API Endpoints:**
- `GET /api/metrics/overview`
- `GET /api/metrics/carrier-validation`
- `GET /api/metrics/load-matching`

## API Endpoints

### Analytics Metrics

#### Get Overview Metrics
```bash
GET /api/metrics/overview
```

#### Get Carrier Validation Metrics
```bash
GET /api/metrics/carrier-validation
```

#### Get Load Matching Metrics
```bash
GET /api/metrics/load-matching
```

### Health Check
```bash
GET /health
```

### Root (API Documentation)
```bash
GET /
```

### Carrier Endpoints

#### 1. Verify Carrier
Validates carrier against FMCSA API and returns eligibility status.

```bash
POST /api/carrier/verify-carrier
Content-Type: application/json

{
  "mc_number": "1515"
}
```

**Response:**
```json
{
  "eligible": true,
  "carrier_info": {
    "mc_number": "1515",
    "dot_number": "44110",
    "legal_name": "GREYHOUND LINES INC",
    ...
  },
  "validation_details": {
    "is_active": true,
    "has_authority": true,
    "allowed_to_operate": true
  }
}
```

### Load Endpoints

#### 2. Assign Load
Finds and assigns the best matching load for a carrier.

**Note:** Equipment types are NOT included since FMCSA API doesn't provide equipment data. Matching is based on cargo types, location, and timeline.

```bash
POST /api/load/assign-load
Content-Type: application/json

{
  "mc_number": "1515",
  "current_location": "Chicago, IL",
  "available_date": "2025-10-20T08:00:00Z"
}
```

**Response:**
```json
{
  "carrier_cargo_info": {
    "mc_number": "1515",
    "cargo_types": ["General Freight", "Passengers"]
  },
  "matched_load": {
    "load_id": 12345,
    "origin": "Chicago, IL",
    "destination": "Denver, CO",
    ...
  },
  "match_factors": {
    "cargo_match": true,
    "location_proximity": 0.98,
    "timeline_feasible": true
  }
}
```

#### 3. Get Available Loads
```bash
GET /api/load/available
```

#### 4. Create Load (Testing)
```bash
POST /api/load/create
Content-Type: application/json

{
  "origin": "Chicago, IL",
  "destination": "Denver, CO",
  "pickup_datetime": "2025-10-21T14:00:00Z",
  "delivery_datetime": "2025-10-23T10:00:00Z",
  "equipment_type": "Reefer",
  "loadboard_rate": 3500.00,
  "weight": 42000,
  "commodity_type": "General Freight",
  "num_pieces": 25,
  "miles": 1004,
  "dimensions": "53x8.5x9",
  "notes": "Temperature controlled"
}
```

## Testing

### FMCSA Integration Tests

Test the FMCSA API integration:

```bash
npx ts-node test/integration/fmcsaService.test.ts
```

This will test all FMCSA endpoints (requires `FMCSA_API_KEY` in `.env`):
- Docket Number lookup (MC → DOT)
- Authority information
- Operation classification
- Cargo carried types

### Manual Testing with curl

**Test 1: Verify Carrier**
```bash
curl -X POST http://localhost:3000/api/carrier/verify-carrier \
  -H "Content-Type: application/json" \
  -d '{"mc_number": "1515"}'
```

**Test 2: Assign Load**
```bash
curl -X POST http://localhost:3000/api/load/assign-load \
  -H "Content-Type: application/json" \
  -d '{
    "mc_number": "1515",
    "current_location": "Chicago, IL"
  }'
```

**Test 3: Get Available Loads**
```bash
curl http://localhost:3000/api/load/available
```

## Technology Stack

### Backend
- **Express.js**: Web framework for RESTful API
- **TypeScript**: Type-safe development
- **lowdb**: File-based JSON database for POC
- **axios**: HTTP client for FMCSA API integration
- **express-validator**: Request validation middleware
- **geolib**: GPS distance calculations
- **city-timezones**: US city geocoding
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment configuration management

### Frontend
- **React 18**: Component-based UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool with HMR
- **TailwindCSS**: Utility-first CSS framework
- **Recharts**: Declarative charting library
- **Axios**: HTTP client for API calls

### DevOps & Build
- **Docker**: Containerization for consistent deployments
- **Docker Compose**: Local development orchestration
- **Node.js 16+**: Runtime environment
- **npm**: Package management

## FMCSA Integration

The API integrates with the FMCSA (Federal Motor Carrier Safety Administration) public API to verify carrier credentials and capabilities:

- **Base URL**: `https://mobile.fmcsa.dot.gov/qc/services/carriers/`
- **Endpoints Used**:
  - `/docket-number/{mc_number}` - Get DOT number and basic carrier info
  - `/{dot_number}/authority` - Carrier authority validation
  - `/{dot_number}/operation-classification` - Operation classification
  - `/{dot_number}/cargo-carried` - Cargo types carrier can haul

### API Flow
1. MC Number → Lookup DOT Number via docket-number endpoint
2. Use DOT Number to query authority, operation classification, and cargo capabilities
3. Cache carrier data for 24 hours to minimize API calls

## Load Matching Algorithm

The matching algorithm considers multiple factors to find the best load for a carrier:

### 1. Cargo Type Compatibility (Mandatory)
- Queries FMCSA cargo-carried endpoint to get carrier's approved cargo types
- Only considers loads with matching commodity types
- Ensures legal and operational compliance

### 2. Distance & Location Proximity
- Uses GPS coordinates via `geolib` and `city-timezones` libraries
- Calculates real distance from carrier's location to pickup point
- Scores loads based on proximity (closer = higher score)

### 3. Timeline Feasibility
- Estimates travel time based on average truck speed (55 mph)
- Adds 20% buffer for realistic conditions (traffic, weather, breaks)
- Requires minimum 2-hour buffer for safety
- Only assigns loads the carrier can realistically reach on time

### 4. Load Value Optimization
- Considers loadboard rate in scoring
- Prioritizes higher-paying loads when other factors are equal

## Data Storage

This POC uses **lowdb** (file-based JSON database):

- **Location**: `data/db.json`
- **Collections**: loads, carriers, assignments
- **Cache TTL**: 24 hours for carrier data

### Database Schema

```json
{
  "loads": [...],
  "carriers": [...],
  "assignments": [...]
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment |
| `DATA_DIR` | ./data | Data directory |
| `FMCSA_API_BASE_URL` | https://mobile.fmcsa.dot.gov/qc/services/carriers | FMCSA API base URL |
| `FMCSA_API_TIMEOUT` | 10000 | API timeout (ms) |
| `CARRIER_CACHE_TTL` | 86400 | Cache TTL (seconds) |
| `LOG_LEVEL` | info | Log level |

## Utility Scripts

The `scripts/` directory contains helpful utilities for development and testing:

### Database Management
```bash
# Clear the database completely
npm run clear-db

# Clear database but preserve API keys
node scripts/clear-db-preserve-keys.js
```

### Mock Data Loading
```bash
# Load mock carrier data for testing
npm run load-mock-carriers

# Load mock load data for testing
npm run load-mock-data

# Generate mock metrics data for dashboard
node scripts/generate-mock-metrics.js
```

### API Key Management
```bash
# Generate a new API key
node scripts/generate-api-key.js

# List all API keys
node scripts/list-api-keys.js

# Revoke an API key
node scripts/revoke-api-key.js
```

### Deployment
```bash
# Deploy to AWS EC2
bash scripts/deploy-to-ec2.sh

# Update existing EC2 deployment
bash scripts/update-ec2.sh
```

See [scripts/README.md](./scripts/README.md) for detailed documentation.

## Future Enhancements

- [ ] Add HTTPS compatibility

## Known Limitations

- **File-based storage**: Uses lowdb for rapid development; migrate to a proper database for production scale
- **Concurrent writes**: Limited support for concurrent operations
- **Equipment matching**: FMCSA API doesn't provide equipment data; matching is based on cargo types only
- **Record capacity**: Optimal performance with ~100-200 records; scale requires database migration

## Additional Resources

- [Deployment Guide](./DEPLOYMENT.md) - Docker and cloud deployment instructions
- [Example Payloads](./example_payloads/) - Sample FMCSA API responses

