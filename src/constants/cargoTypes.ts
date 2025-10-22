/**
 * FMCSA Cargo Classifications
 * Taken from Motor Carrier Identification Report
 * Section 24: CARGO CLASSIFICATIONS
 */

export const CARGO_TYPES = {
  1: 'GENERAL FREIGHT',
  2: 'HOUSEHOLD GOODS',
  3: 'METAL SHEETS; COILS, ROLLS',
  4: 'MOTOR VEHICLES',
  5: 'DRIVE AWAY/TOWAWAY',
  6: 'LOGS, POLES',
  7: 'BUILDING MATERIALS',
  8: 'MOBILE HOMES',
  9: 'MACHINERY, LARGE OBJECTS',
  10: 'FRESH PRODUCE',
  11: 'LIQUIDS/GASES',
  12: 'INTERMODAL CONT.',
  13: 'PASSENGERS',
  14: 'OIL FIELD EQUIPMENT',
  15: 'LIVESTOCK',
  16: 'GRAIN, FEED, HAY',
  17: 'COAL/COKE',
  18: 'MEAT',
  19: 'GARBAGE, REFUSE, TRASH',
  20: 'U.S. MAIL',
  21: 'CHEMICALS',
  22: 'COMMODITIES DRY BULK',
  23: 'REFRIGERATED FOOD',
  24: 'BEVERAGES',
  25: 'PAPER PRODUCTS',
  26: 'UTILITY',
  27: 'FARM SUPPLIES',
  28: 'CONSTRUCTION',
  29: 'WATER WELL',
  30: 'OTHER',
} as const;

export type CargoTypeCode = keyof typeof CARGO_TYPES;
export type CargoTypeName = typeof CARGO_TYPES[CargoTypeCode];

/**
 * Array of all cargo type codes
 */
export const CARGO_TYPE_CODES = Object.keys(CARGO_TYPES).map(Number) as CargoTypeCode[];

/**
 * Array of all cargo type names
 */
export const CARGO_TYPE_NAMES = Object.values(CARGO_TYPES);

/**
 * Helper function to get cargo type name from code
 */
export const getCargoTypeName = (code: CargoTypeCode): CargoTypeName => {
  return CARGO_TYPES[code];
};

/**
 * Helper function to validate if a code is a valid cargo type
 */
export const isValidCargoTypeCode = (code: number): code is CargoTypeCode => {
  return code in CARGO_TYPES;
};

/**
 * Reverse mapping: Cargo type name (normalized) to ID
 * Used for converting FMCSA API descriptions to IDs
 */
const CARGO_TYPE_NAME_TO_ID: Record<string, CargoTypeCode> = {
  'GENERAL FREIGHT': 1,
  'HOUSEHOLD GOODS': 2,
  'METAL SHEETS; COILS, ROLLS': 3,
  'METAL: SHEETS, COILS, ROLLS': 3, // Alternative format
  'MOTOR VEHICLES': 4,
  'DRIVE AWAY/TOWAWAY': 5,
  'DRIVE-AWAY/TOW-AWAY': 5, // Alternative format
  'LOGS, POLES': 6,
  'LOGS, POLES, BEAMS, LUMBER': 6, // Alternative format
  'BUILDING MATERIALS': 7,
  'MOBILE HOMES': 8,
  'MACHINERY, LARGE OBJECTS': 9,
  'FRESH PRODUCE': 10,
  'LIQUIDS/GASES': 11,
  'INTERMODAL CONT.': 12,
  'INTERMODAL CONTAINERS': 12, // Alternative format
  'PASSENGERS': 13,
  'OIL FIELD EQUIPMENT': 14,
  'OILFIELD EQUIPMENT': 14, // Alternative format
  'LIVESTOCK': 15,
  'GRAIN, FEED, HAY': 16,
  'COAL/COKE': 17,
  'MEAT': 18,
  'GARBAGE, REFUSE, TRASH': 19,
  'U.S. MAIL': 20,
  'US MAIL': 20, // Alternative format
  'CHEMICALS': 21,
  'COMMODITIES DRY BULK': 22,
  'REFRIGERATED FOOD': 23,
  'BEVERAGES': 24,
  'PAPER PRODUCTS': 25,
  'UTILITY': 26,
  'FARM SUPPLIES': 27,
  'CONSTRUCTION': 28,
  'WATER WELL': 29,
  'OTHER': 30,
};

/**
 * Helper function to get cargo type ID from description
 * Handles various formats from FMCSA API
 */
export const getCargoTypeIdFromDescription = (description: string): CargoTypeCode | null => {
  const normalized = description.toUpperCase().trim();
  return CARGO_TYPE_NAME_TO_ID[normalized] || null;
};

