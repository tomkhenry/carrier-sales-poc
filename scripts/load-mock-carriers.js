/**
 * Load Mock Carriers Script
 * Loads mock carriers from mock-carriers.json into the database
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'db.json');
const mockCarriersPath = path.join(__dirname, '..', 'data', 'mock-carriers.json');

try {
  // Read the mock carriers data
  console.log('📖 Reading mock carriers data...');
  const mockCarriersData = fs.readFileSync(mockCarriersPath, 'utf8');
  const mockCarriers = JSON.parse(mockCarriersData);
  console.log(`✅ Found ${mockCarriers.length} mock carriers`);

  // Read current database
  console.log('📖 Reading current database...');
  const dbData = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(dbData);
  console.log(`📊 Current database has ${db.loads.length} loads, ${db.carriers.length} carriers`);

  // Check for existing carrier MC numbers to avoid duplicates
  const existingMCNumbers = new Set(db.carriers.map(carrier => carrier.mc_number));
  const newCarriers = mockCarriers.filter(carrier => {
    if (existingMCNumbers.has(carrier.mc_number)) {
      console.log(`⚠️  Skipping carrier MC-${carrier.mc_number} - already exists`);
      return false;
    }
    return true;
  });

  if (newCarriers.length === 0) {
    console.log('ℹ️  No new carriers to add (all mock carriers already exist in database)');
    console.log('💡 Tip: Run "npm run clear-db" first if you want to reload the mock data');
    process.exit(0);
  }

  // Add mock carriers to database
  db.carriers.push(...newCarriers);
  
  // Write updated database
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  
  console.log('\n✅ Mock carriers added successfully!');
  console.log(`📁 Location: ${dbPath}`);
  console.log(`📊 Added ${newCarriers.length} new carriers`);
  console.log(`📊 Total carriers in database: ${db.carriers.length}`);
  console.log('\n🚚 Mock Carriers Summary:');
  
  newCarriers.forEach(carrier => {
    const cargoTypes = carrier.cargo_carried.slice(0, 2).join(', ');
    const moreCount = carrier.cargo_carried.length > 2 ? ` +${carrier.cargo_carried.length - 2} more` : '';
    console.log(`   MC-${carrier.mc_number}: ${carrier.legal_name}`);
    console.log(`      Cargo: ${cargoTypes}${moreCount}`);
  });

  console.log('\n💡 Test these carriers with:');
  console.log('   curl -X POST http://localhost:3000/api/load/assign-load \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log(`     -d '{"mc_number": "${newCarriers[0].mc_number}", "current_location": "Chicago, IL"}'`);

} catch (error) {
  console.error('❌ Error loading mock carriers:', error.message);
  process.exit(1);
}

