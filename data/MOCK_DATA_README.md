# Mock Data Reference

This directory contains mock data for testing the Inbound Carrier Sales Automation API.

## Available Mock Data

### Mock Carriers (`mock-carriers.json`)
6 carriers with diverse cargo capabilities:

| MC Number | Company Name | Cargo Types |
|-----------|--------------|-------------|
| **123456** | National Freight Carriers | General Freight, Household Goods, Metal |
| **234567** | Refrigerated Transport Solutions | Refrigerated Food, Fresh Produce, Meat, Beverages |
| **345678** | Heavy Haul Logistics | Machinery, Building Materials, Construction |
| **456789** | Specialized Tanker Services | Liquids/Gases, Chemicals, Dry Bulk |
| **567890** | West Coast Dry Van Carriers | General Freight, Paper Products, Retail |
| **678901** | Premium Household Movers | Household Goods, General Freight |

### Mock Loads (`mock-loads.json`)
5 loads with various commodity types:

| Load ID | Origin | Destination | Commodity | Rate |
|---------|--------|-------------|-----------|------|
| **1001** | Miami, FL | Atlanta, GA | General Freight | $2,500 |
| **1002** | Los Angeles, CA | Phoenix, AZ | Machinery | $1,800 |
| **1003** | Chicago, IL | New York, NY | Refrigerated Food | $3,200 |
| **1004** | Houston, TX | Denver, CO | Liquids/Gases | $4,100 |
| **1005** | Portland, OR | Seattle, WA | Paper Products | $650 |

## Loading Mock Data

### Load Mock Carriers
```bash
npm run load-mock-carriers
```

### Load Mock Loads
```bash
npm run load-mock-data
```

### Clear Database
```bash
npm run clear-db
```

### Load Everything
```bash
npm run clear-db && npm run load-mock-data && npm run load-mock-carriers
```

## Testing Examples

### Test carrier with matching cargo
```bash
# Refrigerated carrier (MC-234567) looking for refrigerated loads in Chicago
curl -X POST http://localhost:3000/api/load/assign-load \
  -H "Content-Type: application/json" \
  -d '{
    "mc_number": "234567",
    "current_location": "Chicago, IL"
  }'
# Should match Load 1003 (Refrigerated Food, Chicago to New York)
```

### Test carrier with machinery cargo
```bash
# Heavy haul carrier (MC-345678) in Los Angeles
curl -X POST http://localhost:3000/api/load/assign-load \
  -H "Content-Type: application/json" \
  -d '{
    "mc_number": "345678",
    "current_location": "Los Angeles, CA"
  }'
# Should match Load 1002 (Machinery, LA to Phoenix)
```

### Test tanker carrier
```bash
# Tanker carrier (MC-456789) in Houston
curl -X POST http://localhost:3000/api/load/assign-load \
  -H "Content-Type: application/json" \
  -d '{
    "mc_number": "456789",
    "current_location": "Houston, TX"
  }'
# Should match Load 1004 (Liquids/Gases, Houston to Denver)
```

### Test general freight carrier
```bash
# General freight carrier (MC-123456) in Miami
curl -X POST http://localhost:3000/api/load/assign-load \
  -H "Content-Type: application/json" \
  -d '{
    "mc_number": "123456",
    "current_location": "Miami, FL"
  }'
# Should match Load 1001 (General Freight, Miami to Atlanta)
```

## Cargo Type Matching

The mock carriers are designed to match specific loads:

- **General Freight carriers** → General Freight loads
- **Refrigerated carriers** → Refrigerated Food loads  
- **Heavy Haul/Flatbed** → Machinery loads
- **Tanker carriers** → Liquids/Gases loads
- **Dry Van carriers** → Paper Products, General Freight

## Notes

- Carriers in cache won't make FMCSA API calls
- Location proximity affects match scores
- Multiple carriers may match the same load (highest score wins)
- All mock carriers have valid authority and insurance

