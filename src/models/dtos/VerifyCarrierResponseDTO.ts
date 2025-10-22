/**
 * VerifyCarrierResponseDTO - Response object for carrier verification endpoint
 * POST /api/carrier/verify-carrier
 */

/**
 * Detailed validation breakdown for carrier eligibility
 */
export interface ValidationDetails {
  is_active: boolean;              // Carrier status is "A" (Active)
  has_authority: boolean;          // Has active common or contract authority
  insurance_compliant: boolean;    // BIPD insurance on file meets requirements
  allowed_to_operate: boolean;     // Carrier is allowed to operate per FMCSA
}

/**
 * Response object for carrier verification
 */
export interface VerifyCarrierResponseDTO {
  eligible: boolean;               // Overall eligibility status
  mc_number: string;               // MC number (normalized)
  dot_number: string;              // DOT number from FMCSA
  legal_name: string;              // Legal name of carrier
  validation_details: ValidationDetails;
}

