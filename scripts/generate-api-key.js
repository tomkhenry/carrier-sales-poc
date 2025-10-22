#!/usr/bin/env node

/**
 * Generate API Key Script
 * 
 * Usage:
 *   node scripts/generate-api-key.js <name> [--test] [--description "desc"]
 * 
 * Examples:
 *   node scripts/generate-api-key.js "Production App"
 *   node scripts/generate-api-key.js "Development" --test
 *   node scripts/generate-api-key.js "Partner X" --description "API key for Partner X integration"
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const name = args[0];
const isTest = args.includes('--test');
const descriptionIndex = args.indexOf('--description');
const description = descriptionIndex !== -1 ? args[descriptionIndex + 1] : '';

// Validate arguments
if (!name) {
  console.error('❌ Error: API key name is required');
  console.log('\nUsage:');
  console.log('  node scripts/generate-api-key.js <name> [--test] [--description "desc"]');
  console.log('\nExamples:');
  console.log('  node scripts/generate-api-key.js "Production App"');
  console.log('  node scripts/generate-api-key.js "Development" --test');
  console.log('  node scripts/generate-api-key.js "Partner X" --description "Partner X integration"');
  process.exit(1);
}

/**
 * Generate a secure API key
 */
function generateApiKey(isTest = false) {
  const randomBytes = crypto.randomBytes(24);
  const randomString = randomBytes.toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=/g, '')
    .substring(0, 32);

  const prefix = isTest ? 'ics_test_' : 'ics_live_';
  return `${prefix}${randomString}`;
}

/**
 * Main function to generate and store API key
 */
async function main() {
  try {
    console.log('\n🔑 Generating API Key...\n');

    // Generate the key
    const apiKey = generateApiKey(isTest);
    const now = new Date().toISOString();

    const keyData = {
      key: apiKey,
      name: name,
      createdAt: now,
      lastUsedAt: null,
      isActive: true,
      metadata: {
        description: description || undefined,
        environment: isTest ? 'test' : 'production'
      }
    };

    // Read existing db.json
    const dbPath = path.join(__dirname, '..', 'data', 'db.json');
    let db;

    try {
      const dbContent = await fs.readFile(dbPath, 'utf8');
      db = JSON.parse(dbContent);
    } catch (error) {
      console.log('⚠️  db.json not found or invalid, creating new structure...');
      db = {
        carriers: [],
        loads: [],
        apiKeys: []
      };
    }

    // Initialize apiKeys array if it doesn't exist
    if (!db.apiKeys) {
      db.apiKeys = [];
    }

    // Check for duplicate names
    const existingKey = db.apiKeys.find(k => k.name === name);
    if (existingKey) {
      console.error(`❌ Error: API key with name "${name}" already exists`);
      console.log('\nExisting key info:');
      console.log(`  Created: ${existingKey.createdAt}`);
      console.log(`  Active: ${existingKey.isActive}`);
      process.exit(1);
    }

    // Add the new key
    db.apiKeys.push(keyData);

    // Write back to db.json
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));

    // Display success message
    console.log('✅ API Key Generated Successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Name:        ${name}`);
    console.log(`Environment: ${isTest ? 'TEST' : 'PRODUCTION'}`);
    console.log(`Created:     ${now}`);
    if (description) {
      console.log(`Description: ${description}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔐 YOUR API KEY (copy this now, it won\'t be shown again):\n');
    console.log(`   ${apiKey}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 Usage:\n');
    console.log('   Using X-API-Key header:');
    console.log(`   curl -H "X-API-Key: ${apiKey}" http://localhost:3000/api/carrier/verify-carrier`);
    console.log('\n   Using Authorization header:');
    console.log(`   curl -H "Authorization: Bearer ${apiKey}" http://localhost:3000/api/carrier/verify-carrier`);
    console.log('\n⚠️  IMPORTANT: Store this key securely. It cannot be retrieved later.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error generating API key:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

