import { CarrierDTO } from '../dtos/CarrierDTO';
import { CargoTypeCode } from '../../constants/cargoTypes';

/**
 * Carrier Entity
 * Business logic wrapper for CarrierDTO
 */
export class Carrier {
  private data: CarrierDTO;

  constructor(carrierData: CarrierDTO) {
    this.data = carrierData;
  }

  get mcNumber(): string {
    return this.data.mc_number;
  }

  get dotNumber(): string {
    return this.data.dot_number;
  }

  get legalName(): string {
    return this.data.legal_name;
  }

  get statusCode(): string {
    return this.data.status_code;
  }

  get allowedToOperate(): string {
    return this.data.allowed_to_operate;
  }

  get cargoCarried(): CargoTypeCode[] | undefined {
    return this.data.cargo_carried;
  }

  get operationClassification(): string[] {
    return this.data.operation_classification;
  }

  /**
   * Check if carrier is active and eligible to operate
   */
  isEligible(): boolean {
    return (
      this.data.status_code === 'A' &&
      this.data.allowed_to_operate === 'Y' &&
      this.hasActiveAuthority()
    );
  }

  /**
   * Check if carrier has active authority
   */
  hasActiveAuthority(): boolean {
    return (
      this.data.authority.common_authority_status === 'A' ||
      this.data.authority.contract_authority_status === 'A'
    );
  }

  /**
   * Check if carrier is authorized for property (freight)
   */
  isAuthorizedForProperty(): boolean {
    return this.data.authority.authorized_for_property === 'Y';
  }

  /**
   * Check if cache is still valid based on TTL
   */
  isCacheValid(ttlMs: number = 86400000): boolean {
    const cachedTime = new Date(this.data.cached_at).getTime();
    return (Date.now() - cachedTime) < ttlMs;
  }

  /**
   * Check if carrier can haul specific commodity type
   * @param commodityTypeId - Cargo type ID to check
   */
  canHaulCommodity(commodityTypeId: CargoTypeCode): boolean {
    if (!this.data.cargo_carried) {
      return false;
    }
    
    // Check if carrier's cargo_carried includes the commodity type ID
    return this.data.cargo_carried.includes(commodityTypeId);
  }

  /**
   * Get full carrier data
   */
  toDTO(): CarrierDTO {
    return { ...this.data };
  }
}

