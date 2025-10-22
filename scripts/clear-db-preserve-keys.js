/**
 * Clear Database Script (Preserves API Keys)
 * Resets loads, carriers, and assignments but keeps API keys
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'db.json');

try {
  // Read current database
  const dbData = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(dbData);
  
  // Clear data arrays but preserve API keys
  db.loads = [];
  db.carriers = [];
  db.assignments = [];
  
  // Write back to file
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  
  const apiKeyCount = db.apiKeys ? db.apiKeys.length : 0;
  console.log('✅ Database cleared successfully!');
  console.log(`📁 Location: ${dbPath}`);
  console.log('📊 Cleared: loads, carriers, assignments');
  console.log(`🔑 Preserved: ${apiKeyCount} API key(s)`);
} catch (error) {
  console.error('❌ Error clearing database:', error.message);
  process.exit(1);
}

