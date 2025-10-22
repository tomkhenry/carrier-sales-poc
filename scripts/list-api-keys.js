#!/usr/bin/env node

/**
 * List API Keys Script
 * 
 * Usage:
 *   node scripts/list-api-keys.js
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Format date for display
 */
function formatDate(isoString) {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  return date.toLocaleString();
}

/**
 * Main function to list API keys
 */
async function main() {
  try {
    // Read db.json
    const dbPath = path.join(__dirname, '..', 'data', 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf8');
    const db = JSON.parse(dbContent);

    if (!db.apiKeys || db.apiKeys.length === 0) {
      console.log('\n📭 No API keys found.');
      console.log('\nGenerate a new key with:');
      console.log('  node scripts/generate-api-key.js "Key Name"\n');
      return;
    }

    console.log('\n🔑 API Keys\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    db.apiKeys.forEach((key, index) => {
      const status = key.isActive ? '✅ Active' : '❌ Inactive';
      const keyPreview = key.key.substring(0, 20) + '...';
      const lastUsed = key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never';
      
      console.log(`\n${index + 1}. ${key.name}`);
      console.log(`   Status:      ${status}`);
      console.log(`   Key:         ${keyPreview}`);
      console.log(`   Environment: ${key.metadata?.environment || 'N/A'}`);
      console.log(`   Created:     ${formatDate(key.createdAt)}`);
      console.log(`   Last Used:   ${lastUsed}`);
      
      if (key.metadata?.description) {
        console.log(`   Description: ${key.metadata.description}`);
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\nTotal: ${db.apiKeys.length} key(s)`);
    console.log(`Active: ${db.apiKeys.filter(k => k.isActive).length}`);
    console.log(`Inactive: ${db.apiKeys.filter(k => !k.isActive).length}\n`);

  } catch (error) {
    console.error('❌ Error listing API keys:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

