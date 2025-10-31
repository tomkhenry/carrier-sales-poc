/**
 * Generate Mock Metrics Data
 * Creates a week's worth of realistic metrics events for dashboard consistency
 */

const fs = require('fs');
const path = require('path');

// Load mock carriers
const mockCarriersPath = path.join(__dirname, '../data/mock-carriers-for-filters.json');
const mockCarriers = JSON.parse(fs.readFileSync(mockCarriersPath, 'utf-8'));

// Configuration
const DAYS_TO_GENERATE = 7;
const END_DATE = new Date();
const START_DATE = new Date(END_DATE);
START_DATE.setDate(START_DATE.getDate() - DAYS_TO_GENERATE);

// Cities and states for load locations
const LOCATIONS = [
  { state: 'TX', city: 'Dallas' },
  { state: 'TX', city: 'Houston' },
  { state: 'CA', city: 'Los Angeles' },
  { state: 'IL', city: 'Chicago' },
  { state: 'GA', city: 'Atlanta' },
  { state: 'PA', city: 'Philadelphia' },
  { state: 'FL', city: 'Miami' },
  { state: 'NJ', city: 'Newark' },
  { state: 'OH', city: 'Columbus' },
  { state: 'TN', city: 'Memphis' },
];

// Commodity types
const COMMODITY_TYPES = [
  'General Freight',
  'Refrigerated Goods',
  'Machinery',
  'Building Materials',
  'Household Goods',
];

// Helper: Random number between min and max
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Helper: Random integer between min and max (inclusive)
function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

// Helper: Random element from array
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: Generate random timestamp within a day
function randomTimestamp(date) {
  const dayStart = new Date(date);
  dayStart.setHours(6, 0, 0, 0); // Business hours start at 6 AM
  
  const dayEnd = new Date(date);
  dayEnd.setHours(20, 0, 0, 0); // Business hours end at 8 PM
  
  const timestamp = new Date(dayStart.getTime() + Math.random() * (dayEnd.getTime() - dayStart.getTime()));
  return timestamp.toISOString();
}

/**
 * Generate carrier validation events
 */
function generateCarrierValidations() {
  const validations = [];
  let validationId = 1;
  
  for (let day = 0; day < DAYS_TO_GENERATE; day++) {
    const currentDate = new Date(START_DATE);
    currentDate.setDate(currentDate.getDate() + day);
    
    // 5-8 validations per day
    const validationsPerDay = randomInt(5, 8);
    
    for (let i = 0; i < validationsPerDay; i++) {
      const carrier = randomElement(mockCarriers);
      const isSuccessful = Math.random() > 0.2; // 80% success rate
      
      const validation = {
        id: `VAL-${validationId++}`,
        timestamp: randomTimestamp(currentDate),
        carrierId: carrier.mc_number,
        carrierName: carrier.legal_name,
        dotNumber: carrier.dot_number,
        success: isSuccessful,
        validationTimeMs: randomInt(1200, 2500),
      };
      
      // Add failure reason if not successful
      if (!isSuccessful) {
        const failureReasons = [
          'Carrier not found in FMCSA',
          'No active authority',
          'Insurance not compliant',
          'Not allowed to operate',
          'Invalid MC number format',
        ];
        validation.failureReason = randomElement(failureReasons);
      }
      
      validations.push(validation);
    }
  }
  
  return validations;
}

/**
 * Generate load assignment events
 * Returns assignments and metadata needed for offer generation
 */
function generateLoadAssignments() {
  const assignments = [];
  let assignmentId = 1;
  let loadId = 1000;
  
  for (let day = 0; day < DAYS_TO_GENERATE; day++) {
    const currentDate = new Date(START_DATE);
    currentDate.setDate(currentDate.getDate() + day);
    
    // 6-10 load assignments per day (increased to match offer volume)
    const assignmentsPerDay = randomInt(6, 10);
    
    for (let i = 0; i < assignmentsPerDay; i++) {
      const carrier = randomElement(mockCarriers);
      const pickupLocation = randomElement(LOCATIONS);
      const deliveryLocation = randomElement(LOCATIONS.filter(loc => loc.city !== pickupLocation.city));
      const isMatched = Math.random() > 0.25; // 75% match success rate
      const commodityType = randomElement(COMMODITY_TYPES);
      
      const assignment = {
        id: `ASSIGN-${assignmentId++}`,
        timestamp: randomTimestamp(currentDate),
        loadId: `LOAD-${loadId++}`,
        carrierId: carrier.mc_number,
        carrierName: carrier.legal_name,
        matched: isMatched,
        pickupCity: pickupLocation.city,
        pickupState: pickupLocation.state,
        deliveryCity: deliveryLocation.city,
        deliveryState: deliveryLocation.state,
        distanceToPickupMiles: randomInt(30, 150),
        feasibilityScore: parseFloat(randomBetween(0.5, 0.98).toFixed(2)),
        commodityType: commodityType,
      };
      
      assignments.push(assignment);
    }
  }
  
  return assignments;
}

/**
 * Generate load offer events (for business impact)
 * Creates offers based on matched assignments to ensure data consistency
 */
function generateLoadOffers(assignments) {
  const offers = [];
  let offerId = 1;
  
  // Create offers for each matched assignment
  assignments.forEach(assignment => {
    if (assignment.matched) {
      // Generate listed load board rate and final negotiated rate
      const listedLoadBoardRate = randomInt(2000, 4500);
      // Final negotiated rate is typically 5-15% lower than listed rate
      const negotiationDiscount = randomBetween(0.05, 0.15);
      const finalNegotiatedRate = Math.round(listedLoadBoardRate * (1 - negotiationDiscount));
      
      // 70% acceptance rate for matched loads
      const isAccepted = Math.random() > 0.3;
      
      const offer = {
        id: `OFFER-${offerId++}`,
        timestamp: assignment.timestamp, // Use same timestamp as assignment
        carrierId: assignment.carrierId,
        carrierName: assignment.carrierName,
        loadId: assignment.loadId, // Link to the assignment
        commodityType: assignment.commodityType,
        listedLoadBoardRate,
        finalNegotiatedRate,
        ratePerLoad: finalNegotiatedRate, // Keep for backwards compatibility
        accepted: isAccepted,
        revenue: isAccepted ? finalNegotiatedRate : 0,
      };
      
      offers.push(offer);
    }
  });
  
  return offers;
}

/**
 * Main function to generate all mock metrics data
 */
function generateMockMetrics() {
  console.log('Generating mock metrics data...');
  console.log(`Date range: ${START_DATE.toISOString().split('T')[0]} to ${END_DATE.toISOString().split('T')[0]}`);
  console.log(`Using ${mockCarriers.length} mock carriers`);
  
  // Generate assignments first
  const assignments = generateLoadAssignments();
  
  // Generate offers based on matched assignments to ensure consistency
  const offers = generateLoadOffers(assignments);
  
  const metricsData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      startDate: START_DATE.toISOString(),
      endDate: END_DATE.toISOString(),
      daysGenerated: DAYS_TO_GENERATE,
      carrierCount: mockCarriers.length,
    },
    validations: generateCarrierValidations(),
    assignments: assignments,
    offers: offers,
  };
  
  // Write to data directory
  const outputPath = path.join(__dirname, '../data/mock-metrics-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(metricsData, null, 2));
  
  console.log('\n✅ Mock metrics data generated successfully!');
  console.log(`   - ${metricsData.validations.length} carrier validations`);
  console.log(`   - ${metricsData.assignments.length} load assignments (${assignments.filter(a => a.matched).length} matched)`);
  console.log(`   - ${metricsData.offers.length} load offers (${offers.filter(o => o.accepted).length} accepted)`);
  console.log(`\nData saved to: ${outputPath}`);
  console.log('✅ All carriers in Business Impact tab now have corresponding Load Matching data!');
  
  return metricsData;
}

// Run the generator
if (require.main === module) {
  try {
    generateMockMetrics();
  } catch (error) {
    console.error('❌ Error generating mock metrics:', error);
    process.exit(1);
  }
}

module.exports = { generateMockMetrics };

