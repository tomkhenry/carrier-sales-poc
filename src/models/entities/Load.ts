import { LoadDTO } from '../dtos/LoadDTO';
import { CargoTypeCode } from '../../constants/cargoTypes';

/**
 * Load Entity
 * Business logic wrapper for LoadDTO
 */
export class Load {
  private data: LoadDTO;

  constructor(loadData: LoadDTO) {
    this.data = loadData;
  }

  get id(): number {
    return this.data.load_id;
  }

  get origin(): string {
    return this.data.origin;
  }

  get destination(): string {
    return this.data.destination;
  }

  get equipmentType(): string {
    return this.data.equipment_type;
  }

  get commodityType(): CargoTypeCode {
    return this.data.commodity_type;
  }

  get pickupDateTime(): Date {
    return this.data.pickup_datetime;
  }

  get deliveryDateTime(): Date {
    return this.data.delivery_datetime;
  }

  get rate(): number {
    return this.data.loadboard_rate;
  }

  get weight(): number {
    return this.data.weight;
  }

  get miles(): number {
    return this.data.miles;
  }

  get status(): string | undefined {
    return this.data.status;
  }

  /**
   * Check if load is available for assignment
   */
  isAvailable(): boolean {
    return this.data.status === 'available' || !this.data.status;
  }

  /**
   * Check if pickup date is feasible for given available date
   */
  isPickupDateFeasible(availableDate: Date): boolean {
    return new Date(this.data.pickup_datetime) >= availableDate;
  }

  /**
   * Get full load data
   */
  toDTO(): LoadDTO {
    return { ...this.data };
  }
}

