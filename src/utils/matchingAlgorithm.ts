import { LoadDTO } from '../models/dtos/LoadDTO';
import { CarrierDTO } from '../models/dtos/CarrierDTO';
import { Load } from '../models/entities/Load';
import { Carrier } from '../models/entities/Carrier';
import { distanceCalculator, DistanceResult } from './distanceCalculator';

/**
 * Match result interface
 */
export interface MatchResult {
  load: LoadDTO;
  match_score: number;
  match_factors: {
    cargo_match: boolean;
    location_proximity: number;
    timeline_feasible: boolean;
    distance_to_pickup_miles?: number;
    estimated_travel_hours?: number;
    hours_available?: number;
    buffer_hours?: number;
  };
}

/**
 * Matching algorithm for pairing carriers with loads
 * Considers multiple factors: cargo type, location, timeline, rate
 * Uses real distance calculations and travel time estimates
 * Note: Equipment not considered as FMCSA API doesn't provide this data
 */
export class LoadMatchingAlgorithm {
  /**
   * Find best matching load for a carrier
   * Note: FMCSA does not provide equipment type data, so matching is based on:
   * - Cargo type compatibility (mandatory)
   * - Location proximity (calculated using actual distances)
   * - Timeline feasibility (considers travel time from current location to pickup)
   */
  findBestMatch(
    carrier: CarrierDTO,
    loads: LoadDTO[],
    currentLocation: string,
    availableDate: Date
  ): MatchResult | null {
    const carrierEntity = new Carrier(carrier);
    
    // Filter available loads
    const availableLoads = loads.filter(load => {
      const loadEntity = new Load(load);
      return loadEntity.isAvailable();
    });

    if (availableLoads.length === 0) {
      return null;
    }

    // Filter loads by cargo compatibility (mandatory requirement)
    const cargoCompatibleLoads = availableLoads.filter(load => {
      return this.checkCargoMatch(carrierEntity, load);
    });

    if (cargoCompatibleLoads.length === 0) {
      return null;
    }

    // Score each cargo-compatible load
    const scoredLoads = cargoCompatibleLoads.map(load => {
      const matchFactors = this.calculateMatchFactors(
        carrierEntity,
        load,
        currentLocation,
        availableDate
      );
      
      const score = this.calculateOverallScore(matchFactors, load);
      
      return {
        load,
        match_score: score,
        match_factors: matchFactors
      };
    });

    // Sort by score (highest first)
    scoredLoads.sort((a, b) => b.match_score - a.match_score);

    // Return best match (if score > 0)
    const bestMatch = scoredLoads[0];
    return bestMatch.match_score > 0 ? bestMatch : null;
  }

  /**
   * Calculate match factors between carrier and load
   */
  private calculateMatchFactors(
    carrier: Carrier,
    load: LoadDTO,
    currentLocation: string,
    availableDate: Date
  ): MatchResult['match_factors'] {
    // Check cargo compatibility
    const cargoMatch = this.checkCargoMatch(carrier, load);
    
    // Calculate distance and timeline feasibility
    const timelineCheck = distanceCalculator.checkTimelineFeasibility(
      currentLocation,
      load.origin,
      availableDate,
      load.pickup_datetime
    );

    // Calculate proximity score based on distance
    let proximityScore = 0.5; // Default fallback
    if (timelineCheck.distanceToPickup) {
      proximityScore = distanceCalculator.calculateProximityScore(
        timelineCheck.distanceToPickup.distanceInMiles
      );
    }

    return {
      cargo_match: cargoMatch,
      location_proximity: proximityScore,
      timeline_feasible: timelineCheck.isFeasible,
      distance_to_pickup_miles: timelineCheck.distanceToPickup?.distanceInMiles,
      estimated_travel_hours: timelineCheck.hoursNeeded,
      hours_available: timelineCheck.hoursAvailable,
      buffer_hours: timelineCheck.bufferHours
    };
  }

  /**
   * Check if carrier can haul the load's commodity type
   * Compares cargo type IDs
   */
  private checkCargoMatch(carrier: Carrier, load: LoadDTO): boolean {
    if (!carrier.cargoCarried || carrier.cargoCarried.length === 0) {
      // If no cargo data, assume match (benefit of doubt)
      return true;
    }

    // Direct ID comparison - carrier's cargo_carried should include load's commodity_type
    return carrier.canHaulCommodity(load.commodity_type);
  }

  /**
   * Calculate overall match score (0-1)
   * Weighted combination of all factors
   * Note: Equipment not considered as FMCSA doesn't provide this data
   */
  private calculateOverallScore(
    factors: MatchResult['match_factors'],
    load: LoadDTO
  ): number {
    const weights = {
      cargo: 0.4,        // Increased from 0.3 (since no equipment)
      location: 0.35,    // Increased from 0.25
      timeline: 0.25     // Increased from 0.2
    };

    let score = 0;

    // Cargo match (binary)
    score += factors.cargo_match ? weights.cargo : 0;

    // Location proximity (0-1)
    score += factors.location_proximity * weights.location;

    // Timeline feasibility (binary)
    score += factors.timeline_feasible ? weights.timeline : 0;

    // Bonus for higher rate loads (small adjustment)
    const rateBonus = Math.min(load.loadboard_rate / 10000, 0.1);
    score += rateBonus;

    return Math.min(score, 1.0); // Cap at 1.0
  }
}

// Export singleton instance
export const matchingAlgorithm = new LoadMatchingAlgorithm();
export default matchingAlgorithm;

