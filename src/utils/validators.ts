/**
 * Validation utility functions
 */
import { isValidCargoTypeCode, CargoTypeCode } from '../constants/cargoTypes';

/**
 * Validate MC number format
 * MC numbers can be numeric or alphanumeric
 * Accepts both strings and numbers
 */
export function isValidMCNumber(mcNumber: string | number): boolean {
  if (!mcNumber && mcNumber !== 0) {
    return false;
  }
  
  // Convert number to string if needed
  const mcString = typeof mcNumber === 'number' ? mcNumber.toString() : mcNumber;
  
  if (typeof mcString !== 'string') {
    return false;
  }
  
  // Remove any "MC-" prefix if present
  const cleanMC = mcString.replace(/^MC-?/i, '').trim();
  
  // MC numbers are typically numeric, 1-7 digits
  return /^\d{1,7}$/.test(cleanMC);
}

/**
 * Validate DOT number format
 * DOT numbers are numeric, typically 1-8 digits
 */
export function isValidDOTNumber(dotNumber: string): boolean {
  if (!dotNumber || typeof dotNumber !== 'string') {
    return false;
  }
  
  const cleanDOT = dotNumber.trim();
  return /^\d{1,8}$/.test(cleanDOT);
}

/**
 * Normalize MC number (remove prefix, trim)
 * Accepts both strings and numbers
 */
export function normalizeMCNumber(mcNumber: string | number): string {
  const mcString = typeof mcNumber === 'number' ? mcNumber.toString() : mcNumber;
  return mcString.replace(/^MC-?/i, '').trim();
}

/**
 * Normalize DOT number (trim)
 */
export function normalizeDOTNumber(dotNumber: string): string {
  return dotNumber.trim();
}

/**
 * Validate equipment type
 */
export function isValidEquipmentType(equipmentType: string): boolean {
  const validTypes = [
    'Van',
    'Reefer',
    'Flatbed',
    'Step Deck',
    'Lowboy',
    'Tanker',
    'Dump',
    'Container',
    'Auto Carrier',
    'Other'
  ];
  
  return validTypes.some(type => 
    type.toLowerCase() === equipmentType.toLowerCase()
  );
}

/**
 * Validate date string or Date object
 */
export function isValidDate(date: any): boolean {
  if (!date) return false;
  
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Validate location string (basic check)
 */
export function isValidLocation(location: string): boolean {
  if (!location || typeof location !== 'string') {
    return false;
  }
  
  // Basic check: should have at least city and state
  // Format: "City, ST" or "City, State"
  return /^.+,\s*.+$/.test(location.trim());
}

/**
 * Validate load ID
 */
export function isValidLoadId(loadId: any): boolean {
  return typeof loadId === 'number' && loadId > 0 && Number.isInteger(loadId);
}

/**
 * Validate rate (positive number)
 */
export function isValidRate(rate: any): boolean {
  return typeof rate === 'number' && rate > 0;
}

/**
 * Validate weight (positive number)
 */
export function isValidWeight(weight: any): boolean {
  return typeof weight === 'number' && weight > 0;
}

/**
 * Validate cargo type ID
 */
export function isValidCommodityType(commodityType: any): boolean {
  return typeof commodityType === 'number' && isValidCargoTypeCode(commodityType);
}

/**
 * Validate array of cargo type IDs
 */
export function isValidCargoCarried(cargoCarried: any): boolean {
  if (!Array.isArray(cargoCarried)) {
    return false;
  }
  
  return cargoCarried.every(cargo => isValidCommodityType(cargo));
}

