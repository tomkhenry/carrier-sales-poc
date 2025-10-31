import { CarrierDTO } from '../models/dtos/CarrierDTO';
import { Carrier } from '../models/entities/Carrier';
import dbService from '../utils/fileStorage';
import { fmcsaService } from './fmcsaService';
import { logger } from '../utils/logger';
import { storageConfig } from '../config/storage.config';

/**
 * Carrier Service
 * Handles carrier-related business logic, caching, and verification
 */
export class CarrierService {
  /**
   * Find carrier by MC number in cache
   */
  async findByMC(mcNumber: string): Promise<CarrierDTO | null> {
    try {
      const db = await dbService.getDb();
      await db.read();
      
      const carrier = db.data.carriers.find(c => c.mc_number === mcNumber);
      return carrier || null;
    } catch (error: any) {
      logger.error(`Error finding carrier by MC ${mcNumber}:`, error);
      throw error;
    }
  }

  /**
   * Find carrier by DOT number in cache
   */
  async findByDOT(dotNumber: string): Promise<CarrierDTO | null> {
    try {
      const db = await dbService.getDb();
      await db.read();
      
      const carrier = db.data.carriers.find(c => c.dot_number === dotNumber);
      return carrier || null;
    } catch (error: any) {
      logger.error(`Error finding carrier by DOT ${dotNumber}:`, error);
      throw error;
    }
  }

  /**
   * Cache or update carrier information
   */
  async cacheCarrier(carrier: CarrierDTO): Promise<void> {
    try {
      const db = await dbService.getDb();
      await db.read();
      
      // Check if carrier already exists
      const index = db.data.carriers.findIndex(c => c.mc_number === carrier.mc_number);
      
      if (index !== -1) {
        // Update existing
        db.data.carriers[index] = carrier;
        logger.info(`Updated carrier cache for MC ${carrier.mc_number}`);
      } else {
        // Add new
        db.data.carriers.push(carrier);
        logger.info(`Added carrier to cache for MC ${carrier.mc_number}`);
      }
      
      await db.write();
    } catch (error: any) {
      logger.error(`Error caching carrier for MC ${carrier.mc_number}:`, error);
      throw error;
    }
  }

  /**
   * Check if cached carrier data is still valid
   */
  isCacheValid(carrier: CarrierDTO): boolean {
    const carrierEntity = new Carrier(carrier);
    return carrierEntity.isCacheValid(storageConfig.cache.carrierTTL);
  }

  /**
   * Get carrier from cache or fetch from FMCSA if not cached/expired
   */
  async getCarrier(mcNumber: string, forceRefresh: boolean = false): Promise<CarrierDTO | null> {
    if (!forceRefresh) {
      const cached = await this.findByMC(mcNumber);
      if (cached && this.isCacheValid(cached)) {
        logger.info(`Using cached carrier data for MC ${mcNumber}`);
        return cached;
      }
    }

    // If not cached or expired, would fetch from FMCSA
    // This would be implemented in verify-carrier endpoint
    logger.info(`Carrier cache miss or expired for MC ${mcNumber}`);
    return null;
  }

  /**
   * Get DOT number from cache (used by assign-load)
   */
  async getDotNumberFromCache(mcNumber: string): Promise<string | null> {
    const carrier = await this.findByMC(mcNumber);
    return carrier ? carrier.dot_number : null;
  }

  /**
   * Get all cached carriers
   */
  async getAllCarriers(): Promise<CarrierDTO[]> {
    try {
      const db = await dbService.getDb();
      await db.read();
      
      return db.data.carriers || [];
    } catch (error: any) {
      logger.error('Error fetching all carriers:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const carrierService = new CarrierService();
export default carrierService;

