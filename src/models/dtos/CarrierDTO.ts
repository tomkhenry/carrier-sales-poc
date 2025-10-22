import { CargoTypeCode } from '../../constants/cargoTypes';

/**
 * CarrierDTO - Data Transfer Object for Carrier information
 * Combines data from multiple FMCSA API endpoints
 */
export interface CarrierDTO {
  mc_number: string;                   // MC number (input/index key)
  dot_number: string;                  // DOT number (extracted from docket-number endpoint)
  legal_name: string;
  dba_name?: string;
  status_code: string;                 // "A" = Active
  allowed_to_operate: string;          // "Y" or "N"
  safety_rating?: string;              // "S" = Satisfactory, "U" = Unsatisfactory, etc.
  
  // From authority endpoint (using DOT)
  authority: {
    common_authority_status: string;   // "A" = Active, "I" = Inactive
    contract_authority_status: string;
    authorized_for_property: string;   // "Y" or "N"
    authorized_for_passenger: string;  // "Y" or "N"
    authorized_for_household_goods: string;
  };
  
  // From operation-classification endpoint (using DOT)
  operation_classification: string[];  // e.g., ["Authorized For Hire"]
  
  // From cargo-carried endpoint (using DOT) - optional, fetched on demand
  cargo_carried?: CargoTypeCode[];     // Array of cargo type IDs (e.g., [1, 13] for "General Freight" and "Passengers")
  
  // Insurance info (from docket-number endpoint)
  insurance: {
    bipd_on_file: string;
    bipd_required: string;
    cargo_on_file: string;
  };
  
  // Cache metadata
  last_verified: Date;
  cached_at: Date;
}

