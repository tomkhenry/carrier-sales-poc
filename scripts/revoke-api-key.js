#!/usr/bin/env node

/**
 * Revoke API Key Script
 * 
 * Usage:
 *   node scripts/revoke-api-key.js <name>
 * 
 * Example:
 *   node scripts/revoke-api-key.js "Development"
 */

const fs = require('fs').promises;
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const name = args[0];

// Validate arguments
if (!name) {
  console.error('❌ Error: API key name is required');
  console.log('\nUsage:');
  console.log('  node scripts/revoke-api-key.js <name>');
  console.log('\nExample:');
  console.log('  node scripts/revoke-api-key.js "Development"');
  process.exit(1);
}

/**
 * Main function to revoke API key
 */
async function main() {
  try {
    // Read db.json
    const dbPath = path.join(__dirname, '..', 'data', 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf8');
    const db = JSON.parse(dbContent);

    if (!db.apiKeys) {
      db.apiKeys = [];
    }

    // Find the key
    const keyIndex = db.apiKeys.findIndex(k => k.name === name);

    if (keyIndex === -1) {
      console.error(`❌ Error: API key with name "${name}" not found`);
      console.log('\nAvailable keys:');
      db.apiKeys.forEach(k => console.log(`  - ${k.name}`));
      process.exit(1);
    }

    const key = db.apiKeys[keyIndex];

    if (!key.isActive) {
      console.log(`⚠️  API key "${name}" is already inactive`);
      process.exit(0);
    }

    // Deactivate the key
    db.apiKeys[keyIndex].isActive = false;

    // Write back to db.json
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));

    console.log('\n✅ API Key Revoked Successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Name:     ${key.name}`);
    console.log(`Created:  ${new Date(key.createdAt).toLocaleString()}`);
    console.log(`Revoked:  ${new Date().toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  This key can no longer be used to access the API.\n');

  } catch (error) {
    console.error('❌ Error revoking API key:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

