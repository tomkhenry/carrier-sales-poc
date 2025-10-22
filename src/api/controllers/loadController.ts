import { Request, Response, NextFunction } from 'express';
import { loadService } from '../../services/loadService';
import { carrierService } from '../../services/carrierService';
import { fmcsaService } from '../../services/fmcsaService';
import { matchingAlgorithm } from '../../utils/matchingAlgorithm';
import { logger } from '../../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { normalizeMCNumber } from '../../utils/validators';
import { AssignLoadResponseDTO } from '../../models/dtos/AssignLoadResponseDTO';

/**
 * Load Controller
 * Handles HTTP requests related to load operations
 */
export class LoadController {
  /**
   * POST /api/load/assign-load
   * Find and assign best matching load for carrier
   * 
   * Request body: {
   *   mc_number: string,
   *   current_location: string
   * }
   * 
   * Response: AssignLoadResponseDTO
   * 
   * Note: Equipment types not considered as FMCSA API doesn't provide this data
   * Note: Timeline is assumed to be current date/time (carrier available now)
   */
  async assignLoad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mc_number, current_location } = req.body;
      const normalizedMC = normalizeMCNumber(mc_number);

      logger.info(`Assigning load for carrier MC: ${normalizedMC}`);

      // 1. Get DOT number from cache or fetch from FMCSA
      let dotNumber = await carrierService.getDotNumberFromCache(normalizedMC);
      
      if (!dotNumber) {
        logger.info(`DOT number not in cache for MC ${normalizedMC}, fetching from FMCSA`);
        dotNumber = await fmcsaService.getDotNumberFromMC(
          normalizedMC,
          carrierService.getDotNumberFromCache.bind(carrierService)
        );
      }

      logger.info(`Using DOT number ${dotNumber} for MC ${normalizedMC}`);

      // 2. Query FMCSA cargo-carried endpoint with DOT
      const cargoTypes = await fmcsaService.getCargoCarried(dotNumber);
      logger.info(`Carrier can haul: ${cargoTypes.join(', ')}`);

      // 3. Get available loads
      const availableLoads = await loadService.getAvailableLoads();
      logger.info(`Found ${availableLoads.length} available loads`);

      if (availableLoads.length === 0) {
        throw new AppError('No available loads found', 404);
      }

      // 4. Get or create carrier object with cargo data
      let carrier = await carrierService.findByMC(normalizedMC);
      
      if (carrier) {
        // Update cargo_carried if not present or outdated
        carrier.cargo_carried = cargoTypes;
        await carrierService.cacheCarrier(carrier);
      } else {
        // Create minimal carrier object for matching
        carrier = {
          mc_number: normalizedMC,
          dot_number: dotNumber,
          cargo_carried: cargoTypes,
          legal_name: '',
          status_code: 'A',
          allowed_to_operate: 'Y',
          authority: {
            common_authority_status: 'A',
            contract_authority_status: 'A',
            authorized_for_property: 'Y',
            authorized_for_passenger: 'N',
            authorized_for_household_goods: 'N'
          },
          operation_classification: [],
          insurance: {
            bipd_on_file: '',
            bipd_required: '',
            cargo_on_file: ''
          },
          last_verified: new Date(),
          cached_at: new Date()
        };
        await carrierService.cacheCarrier(carrier);
      }

      // 5. Use matching algorithm to find best match
      // Assume carrier is available now (current date/time)
      const availableDateObj = new Date();
      const matchResult = matchingAlgorithm.findBestMatch(
        carrier,
        availableLoads,
        current_location,
        availableDateObj
      );

      if (!matchResult) {
        throw new AppError('No suitable loads found for this carrier', 404);
      }

      logger.info(`Best match found: Load ${matchResult.load.load_id} with score ${matchResult.match_score}`);

      // 6. Create assignment record
      await loadService.createAssignment(
        matchResult.load.load_id,
        normalizedMC,
        matchResult.match_score
      );

      // 7. Return matched load and details
      const response: AssignLoadResponseDTO = {
        success: true,
        carrier_cargo_info: {
          mc_number: normalizedMC,
          dot_number: dotNumber,
          cargo_types: cargoTypes
        },
        matched_load: {
          ...matchResult.load,
          match_score: matchResult.match_score
        },
        match_factors: matchResult.match_factors
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/load/available
   * Get all available loads (helper endpoint)
   */
  async getAvailableLoads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loads = await loadService.getAvailableLoads();
      
      res.status(200).json({
        success: true,
        count: loads.length,
        loads
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/load/create
   * Create a new load (helper endpoint for testing)
   */
  async createLoad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loadData = req.body;
      const newLoad = await loadService.addLoad(loadData);
      
      res.status(201).json({
        success: true,
        load: newLoad
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const loadController = new LoadController();
export default loadController;

