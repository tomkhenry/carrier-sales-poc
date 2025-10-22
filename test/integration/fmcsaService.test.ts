/**
 * Integration Test for FMCSA API Service
 * Tests actual API calls to FMCSA endpoints
 * 
 * Run with: npx ts-node test/integration/fmcsaService.test.ts
 */

import dotenv from 'dotenv';
import { fmcsaService } from '../../src/services/fmcsaService';
import { logger } from '../../src/utils/logger';

// Load environment variables
dotenv.config();

/**
 * Test FMCSA endpoints with a known MC number
 */
async function testFMCSAEndpoints() {
  console.log('\n=== Testing FMCSA API Endpoints ===\n');

  // Test MC number (from example_payloads)
  const testMC = '1515';
  const testDOT = '44110';

  try {
    // Test 1: Get docket number (MC → DOT)
    console.log(`\n--- Test 1: Docket Number Lookup (MC: ${testMC}) ---`);
    const docketInfo = await fmcsaService.getDocketNumberByMC(testMC);
    console.log('✅ Success!');
    console.log('Legal Name:', docketInfo.legalName);
    console.log('DBA Name:', docketInfo.dbaName);
    console.log('DOT Number:', docketInfo.dotNumber);
    console.log('Status:', docketInfo.statusCode);
    console.log('Allowed to Operate:', docketInfo.allowedToOperate);

    const dotNumber = docketInfo.dotNumber.toString();

    // Test 2: Get authority
    console.log(`\n--- Test 2: Authority Lookup (DOT: ${dotNumber}) ---`);
    const authority = await fmcsaService.getAuthority(dotNumber);
    console.log('✅ Success!');
    if (authority.length > 0) {
      const auth = authority[0];
      console.log('Common Authority:', auth.carrierAuthority?.commonAuthorityStatus);
      console.log('Contract Authority:', auth.carrierAuthority?.contractAuthorityStatus);
      console.log('Authorized for Property:', auth.carrierAuthority?.authorizedForProperty);
    }

    // Test 3: Get operation classification
    console.log(`\n--- Test 3: Operation Classification (DOT: ${dotNumber}) ---`);
    const opClass = await fmcsaService.getOperationClassification(dotNumber);
    console.log('✅ Success!');
    console.log('Operation Classifications:', opClass);

    // Test 4: Get cargo carried
    console.log(`\n--- Test 4: Cargo Carried (DOT: ${dotNumber}) ---`);
    const cargo = await fmcsaService.getCargoCarried(dotNumber);
    console.log('✅ Success!');
    console.log('Cargo Types:', cargo);

    console.log('\n=== All Tests Passed! ===\n');
    
  } catch (error: any) {
    console.error('\n❌ Test Failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
testFMCSAEndpoints();

