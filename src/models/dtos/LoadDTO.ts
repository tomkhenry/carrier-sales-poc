import { CargoTypeCode } from '../../constants/cargoTypes';

/**
 * LoadDTO - Data Transfer Object for Load information
 * Represents a freight load available for assignment to carriers
 */
export interface LoadDTO {
  load_id: number;
  origin: string;
  destination: string;
  pickup_datetime: Date;
  delivery_datetime: Date;
  equipment_type: string;
  loadboard_rate: number;
  notes: string;
  weight: number;
  commodity_type: CargoTypeCode;  // Cargo type ID (e.g., 1 for "General Freight")
  num_pieces: number;
  miles: number;
  dimensions: string;
  status?: string;
  created_at?: Date;
}

