import { LoadDTO } from './LoadDTO';
import { CargoTypeCode } from '../../constants/cargoTypes';

/**
 * Carrier Cargo Info - Simplified carrier information for load assignment
 */
export interface CarrierCargoInfo {
  mc_number: string;
  dot_number: string;
  cargo_types: CargoTypeCode[];  // Array of cargo type IDs (e.g., [1, 13] for "General Freight" and "Passengers")
}

/**
 * Match Factors - Breakdown of why a load was matched
 */
export interface MatchFactors {
  cargo_match: boolean;         // Whether carrier can haul this cargo type
  location_proximity: number;   // 0-1 score for location proximity
  timeline_feasible: boolean;   // Whether pickup timeline is feasible
}

/**
 * Matched Load - Load with match score
 */
export interface MatchedLoad extends LoadDTO {
  match_score: number;           // 0-1 overall match score
}

/**
 * AssignLoadResponseDTO - Response for POST /api/load/assign-load
 * Returns the best matching load for a carrier with detailed match information
 */
export interface AssignLoadResponseDTO {
  success: boolean;
  carrier_cargo_info: CarrierCargoInfo;
  matched_load: MatchedLoad;
  match_factors: MatchFactors;
}

