# Inbound Carrier Sales Automation API

Express.js API for matching freight loads with carriers based on FMCSA data and carrier capabilities.

## Overview

This POC API determines which loads best fit a carrier given carrier and load information. It acts as a freight broker API to decide which loads fit the inquiring carrier.

### Key Features

- ✅ **Carrier Verification**: Validate carriers against FMCSA API (MC→DOT lookup, authority, operation classification)
- ✅ **Load Matching**: Match carriers with loads using FMCSA cargo data and intelligent algorithms
- ✅ **Caching**: 24-hour cache for carrier data to minimize API calls
- ✅ **File-based Storage**: Uses lowdb for rapid POC development

## Project Structure

```
src/
├── api/
│   ├── routes/              # Express routes
│   │   ├── carrier.routes.ts
│   │   └── load.routes.ts
│   ├── controllers/         # Request handlers
│   │   ├── carrierController.ts
│   │   └── loadController.ts
│   └── middleware/          # Express middleware
│       ├── errorHandler.ts
│       ├── validation.ts
│       └── requestLogger.ts
├── models/
│   ├── dtos/               # Data Transfer Objects
│   │   ├── LoadDTO.ts
│   │   ├── CarrierDTO.ts
│   │   └── MetricsDTO.ts
│   └── entities/           # Business logic entities
│       ├── Load.ts
│       └── Carrier.ts
├── services/               # Business logic layer
│   ├── fmcsaService.ts    # FMCSA API integration
│   ├── carrierService.ts  # Carrier operations
│   └── loadService.ts     # Load operations
├── utils/                  # Helper utilities
│   ├── fileStorage.ts     # lowdb database
│   ├── logger.ts          # Logging utility
│   ├── validators.ts      # Validation helpers
│   └── matchingAlgorithm.ts  # Load matching logic
├── config/                 # Configuration
│   ├── app.config.ts
│   └── storage.config.ts
└── app.ts                  # Express app entry point
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
```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot-reload enabled.

### Production Mode
```bash
npm run build
npm start
```

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

## API Endpoints

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

- **Express.js**: Web framework
- **TypeScript**: Type safety
- **lowdb**: File-based JSON database
- **axios**: HTTP client for FMCSA API
- **express-validator**: Request validation
- **geolib**: Distance calculations
- **city-timezones**: Geocoding for US cities
- **cors**: CORS handling
- **dotenv**: Environment configuration

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

The `scripts/` directory contains helpful utilities:

```bash
# Clear the database
npm run clear-db

# Load mock carrier data for testing
npm run load-mock-carriers

# Load mock load data for testing
npm run load-mock-data
```

## Future Enhancements

- [ ] Migrate to PostgreSQL/MongoDB for production-scale data storage
- [ ] Add authentication and authorization
- [ ] Implement comprehensive test suite
- [ ] Add real-time notifications for load assignments
- [ ] ML-based matching optimization learning from historical data
- [ ] OSRM integration for real driving routes
- [ ] HOS (Hours of Service) compliance checking

## Known Limitations

- **File-based storage**: Uses lowdb for rapid development; migrate to a proper database for production scale
- **Concurrent writes**: Limited support for concurrent operations
- **Equipment matching**: FMCSA API doesn't provide equipment data; matching is based on cargo types only
- **Record capacity**: Optimal performance with ~100-200 records; scale requires database migration

## Additional Resources

- [Deployment Guide](./DEPLOYMENT.md) - Docker and cloud deployment instructions
- [Example Payloads](./example_payloads/) - Sample FMCSA API responses

