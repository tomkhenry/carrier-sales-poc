import { getDistance } from 'geolib';
import * as cityTimezones from 'city-timezones';

/**
 * Interface for geographic coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Interface for distance calculation result
 */
export interface DistanceResult {
  distanceInMiles: number;
  distanceInKm: number;
  estimatedTravelHours: number;
}

/**
 * Distance Calculator Utility
 * Uses geolib for distance calculations and city-timezones for geocoding
 */
export class DistanceCalculator {
  // Average truck speed including rest stops, fuel, etc. (miles per hour)
  private readonly AVERAGE_TRUCK_SPEED_MPH = 55;

  /**
   * Parse location string to get city and state
   * Supports formats: "City, ST" or "City, State"
   */
  private parseLocation(location: string): { city: string; state: string } {
    const parts = location.split(',').map(s => s.trim());
    if (parts.length < 2) {
      throw new Error(`Invalid location format: ${location}. Expected "City, State"`);
    }
    return {
      city: parts[0],
      state: parts[1]
    };
  }

  /**
   * Get coordinates for a location using city-timezones database
   * @param location - Location string in format "City, ST"
   * @returns Coordinates object or null if not found
   */
  getCoordinates(location: string): Coordinates | null {
    try {
      const { city, state } = this.parseLocation(location);
      
      // Search for city in the database
      const cityLookup = cityTimezones.lookupViaCity(city);
      
      if (!cityLookup || cityLookup.length === 0) {
        return null;
      }

      // Filter by state if multiple results
      const stateAbbrev = state.toUpperCase();
      let match = cityLookup.find((c: any) => 
        c.province?.toUpperCase() === stateAbbrev || 
        c.province?.toUpperCase().startsWith(stateAbbrev.substring(0, 2))
      );

      // If no state match, use first result
      if (!match) {
        match = cityLookup[0];
      }

      return {
        latitude: match.lat,
        longitude: match.lng
      };
    } catch (error) {
      console.error(`Error getting coordinates for ${location}:`, error);
      return null;
    }
  }

  /**
   * Calculate distance between two locations
   * @param origin - Origin location string (e.g., "Miami, FL")
   * @param destination - Destination location string (e.g., "Atlanta, GA")
   * @returns DistanceResult or null if coordinates cannot be found
   */
  calculateDistance(origin: string, destination: string): DistanceResult | null {
    const originCoords = this.getCoordinates(origin);
    const destCoords = this.getCoordinates(destination);

    if (!originCoords || !destCoords) {
      console.warn(`Could not find coordinates for origin: ${origin} or destination: ${destination}`);
      return null;
    }

    return this.calculateDistanceFromCoordinates(originCoords, destCoords);
  }

  /**
   * Calculate distance between two coordinate points
   * @param origin - Origin coordinates
   * @param destination - Destination coordinates
   * @returns DistanceResult with distance and estimated travel time
   */
  calculateDistanceFromCoordinates(
    origin: Coordinates,
    destination: Coordinates
  ): DistanceResult {
    // Calculate distance in meters using geolib
    const distanceInMeters = getDistance(
      { latitude: origin.latitude, longitude: origin.longitude },
      { latitude: destination.latitude, longitude: destination.longitude }
    );

    // Convert to miles and kilometers
    const distanceInKm = distanceInMeters / 1000;
    const distanceInMiles = distanceInKm * 0.621371;

    // Estimate travel time in hours
    // Add 20% buffer for realistic trucking conditions (stops, traffic, etc.)
    const estimatedTravelHours = (distanceInMiles / this.AVERAGE_TRUCK_SPEED_MPH) * 1.2;

    return {
      distanceInMiles,
      distanceInKm,
      estimatedTravelHours
    };
  }

  /**
   * Check if carrier can reach pickup location on time
   * @param carrierLocation - Current carrier location
   * @param pickupLocation - Pickup location
   * @param carrierAvailableDate - When carrier becomes available
   * @param pickupDateTime - When pickup is scheduled
   * @returns Object with feasibility and time details
   */
  checkTimelineFeasibility(
    carrierLocation: string,
    pickupLocation: string,
    carrierAvailableDate: Date,
    pickupDateTime: Date
  ): {
    isFeasible: boolean;
    distanceToPickup: DistanceResult | null;
    hoursAvailable: number;
    hoursNeeded: number;
    bufferHours: number;
  } {
    // Calculate distance from carrier to pickup location
    const distanceToPickup = this.calculateDistance(carrierLocation, pickupLocation);

    // Calculate time available (in hours)
    const availableTime = new Date(carrierAvailableDate);
    const pickupTime = new Date(pickupDateTime);
    const hoursAvailable = (pickupTime.getTime() - availableTime.getTime()) / (1000 * 60 * 60);

    // If we can't calculate distance, assume it's feasible if pickup is in future
    if (!distanceToPickup) {
      return {
        isFeasible: hoursAvailable > 0,
        distanceToPickup: null,
        hoursAvailable,
        hoursNeeded: 0,
        bufferHours: hoursAvailable
      };
    }

    const hoursNeeded = distanceToPickup.estimatedTravelHours;
    const bufferHours = hoursAvailable - hoursNeeded;

    // Carrier is feasible if they have enough time to reach pickup
    // Require at least 2 hours buffer for safety
    const isFeasible = bufferHours >= 2;

    return {
      isFeasible,
      distanceToPickup,
      hoursAvailable,
      hoursNeeded,
      bufferHours
    };
  }

  /**
   * Calculate a proximity score based on distance
   * @param distanceInMiles - Distance in miles
   * @returns Score between 0 and 1 (1 = very close, 0 = very far)
   */
  calculateProximityScore(distanceInMiles: number): number {
    // Score calculation:
    // 0-50 miles: 1.0 (excellent)
    // 50-150 miles: 0.9-0.7 (good)
    // 150-300 miles: 0.7-0.5 (fair)
    // 300-500 miles: 0.5-0.3 (acceptable)
    // 500+ miles: 0.3-0.1 (poor)
    
    if (distanceInMiles <= 50) return 1.0;
    if (distanceInMiles <= 150) return 0.9 - ((distanceInMiles - 50) / 100) * 0.2;
    if (distanceInMiles <= 300) return 0.7 - ((distanceInMiles - 150) / 150) * 0.2;
    if (distanceInMiles <= 500) return 0.5 - ((distanceInMiles - 300) / 200) * 0.2;
    
    // Exponential decay for very far distances
    return Math.max(0.1, 0.3 * Math.exp(-(distanceInMiles - 500) / 1000));
  }
}

// Export singleton instance
export const distanceCalculator = new DistanceCalculator();
export default distanceCalculator;

