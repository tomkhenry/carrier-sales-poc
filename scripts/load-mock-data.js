/**
 * Load Mock Data Script
 * Loads mock loads from mock-loads.json into the database
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'db.json');
const mockLoadsPath = path.join(__dirname, '..', 'data', 'mock-loads.json');

try {
  // Read the mock loads data
  console.log('📖 Reading mock loads data...');
  const mockLoadsData = fs.readFileSync(mockLoadsPath, 'utf8');
  const mockLoads = JSON.parse(mockLoadsData);
  console.log(`✅ Found ${mockLoads.length} mock loads`);

  // Read current database
  console.log('📖 Reading current database...');
  const dbData = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(dbData);
  console.log(`📊 Current database has ${db.loads.length} loads, ${db.carriers.length} carriers`);

  // Check for existing load IDs to avoid duplicates
  const existingLoadIds = new Set(db.loads.map(load => load.load_id));
  const newLoads = mockLoads.filter(load => {
    if (existingLoadIds.has(load.load_id)) {
      console.log(`⚠️  Skipping load ${load.load_id} - already exists`);
      return false;
    }
    return true;
  });

  if (newLoads.length === 0) {
    console.log('ℹ️  No new loads to add (all mock loads already exist in database)');
    console.log('💡 Tip: Run "npm run clear-db" first if you want to reload the mock data');
    process.exit(0);
  }

  // Add mock loads to database
  db.loads.push(...newLoads);
  
  // Write updated database
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  
  console.log('\n✅ Mock loads added successfully!');
  console.log(`📁 Location: ${dbPath}`);
  console.log(`📊 Added ${newLoads.length} new loads`);
  console.log(`📊 Total loads in database: ${db.loads.length}`);
  console.log('\n📦 Mock Loads Summary:');
  
  newLoads.forEach(load => {
    console.log(`   ${load.load_id}: ${load.origin} → ${load.destination} (${load.commodity_type})`);
  });

} catch (error) {
  console.error('❌ Error loading mock data:', error.message);
  process.exit(1);
}


