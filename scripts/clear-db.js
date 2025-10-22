/**
 * Clear Database Script
 * Resets db.json to initial empty state
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'db.json');

const emptyDb = {
  loads: [],
  carriers: [],
  assignments: []
};

try {
  fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2));
  console.log('✅ Database cleared successfully!');
  console.log(`📁 Location: ${dbPath}`);
  console.log('📊 Reset to: { loads: [], carriers: [], assignments: [] }');
} catch (error) {
  console.error('❌ Error clearing database:', error.message);
  process.exit(1);
}

