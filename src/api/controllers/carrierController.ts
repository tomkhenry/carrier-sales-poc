import { Request, Response, NextFunction } from 'express';
import { carrierService } from '../../services/carrierService';
import { fmcsaService } from '../../services/fmcsaService';
import { logger } from '../../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { normalizeMCNumber } from '../../utils/validators';
import { VerifyCarrierResponseDTO, ValidationDetails } from '../../models/dtos/VerifyCarrierResponseDTO';

/**
 * Carrier Controller
 * Handles HTTP requests related to carrier operations
 */
export class CarrierController {
  /**
   * POST /api/carrier/verify-carrier
   * Verify carrier eligibility via FMCSA API
   * 
   * @param req.body.mc_number - MC number to verify
   * @returns VerifyCarrierResponseDTO - Eligibility status and validation details
   * 
   * Note: Full carrier info is cached in the database for future use
   */
  async verifyCarrier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mc_number } = req.body;
      const normalizedMC = normalizeMCNumber(mc_number);

      logger.info(`Verifying carrier with MC: ${normalizedMC}`);

      // Step 1: Check cache for existing carrier
      let carrierInfo = await carrierService.findByMC(normalizedMC);
      
      if (carrierInfo && carrierService.isCacheValid(carrierInfo)) {
        logger.info(`Using cached carrier data for MC ${normalizedMC}`);
      } else {
        // Step 2: If not cached or expired, query FMCSA
        logger.info(`Fetching fresh carrier data for MC ${normalizedMC}`);
        
        // Get DOT number and basic info from docket-number endpoint
        const docketInfo = await fmcsaService.getDocketNumberByMC(normalizedMC);
        const dotNumber = docketInfo.dotNumber.toString();
        
        // Query authority and operation classification in parallel
        const [authorityData, operationClassification] = await Promise.all([
          fmcsaService.getAuthority(dotNumber),
          fmcsaService.getOperationClassification(dotNumber)
        ]);
        
        // Step 3: Build CarrierDTO
        const authorityInfo = authorityData[0]?.carrierAuthority || {};
        
        carrierInfo = {
          mc_number: normalizedMC,
          dot_number: dotNumber,
          legal_name: docketInfo.legalName || '',
          dba_name: docketInfo.dbaName,
          status_code: docketInfo.statusCode || '',
          allowed_to_operate: docketInfo.allowedToOperate || 'N',
          safety_rating: docketInfo.safetyRating,
          authority: {
            common_authority_status: authorityInfo.commonAuthorityStatus || '',
            contract_authority_status: authorityInfo.contractAuthorityStatus || '',
            authorized_for_property: authorityInfo.authorizedForProperty || 'N',
            authorized_for_passenger: authorityInfo.authorizedForPassenger || 'N',
            authorized_for_household_goods: authorityInfo.authorizedForHouseholdGoods || 'N'
          },
          operation_classification: operationClassification,
          insurance: {
            bipd_on_file: docketInfo.bipdInsuranceOnFile || '0',
            bipd_required: docketInfo.bipdRequiredAmount || '0',
            cargo_on_file: docketInfo.cargoInsuranceOnFile || '0'
          },
          last_verified: new Date(),
          cached_at: new Date()
        };
        
        // Step 4: Cache the carrier info
        await carrierService.cacheCarrier(carrierInfo);
        logger.info(`Cached carrier data for MC ${normalizedMC}`);
      }

      // Step 5: Determine eligibility
      const isActive = carrierInfo.status_code === 'A';
      const isAllowedToOperate = carrierInfo.allowed_to_operate === 'Y';
      const hasActiveAuthority = 
        carrierInfo.authority.common_authority_status === 'A' ||
        carrierInfo.authority.contract_authority_status === 'A';
      const hasPropertyAuthorization = carrierInfo.authority.authorized_for_property === 'Y';
      
      // Check insurance compliance
      const bipdOnFile = parseFloat(carrierInfo.insurance.bipd_on_file);
      const bipdRequired = parseFloat(carrierInfo.insurance.bipd_required);
      const isInsuranceCompliant = bipdOnFile >= bipdRequired;
      
      const eligible = isActive && isAllowedToOperate && hasActiveAuthority && isInsuranceCompliant;

      // Step 6: Build validation details
      const validationDetails: ValidationDetails = {
        is_active: isActive,
        has_authority: hasActiveAuthority,
        insurance_compliant: isInsuranceCompliant,
        allowed_to_operate: isAllowedToOperate
      };
      
      // Step 7: Return eligibility response
      const response: VerifyCarrierResponseDTO = {
        eligible,
        mc_number: carrierInfo.mc_number,
        dot_number: carrierInfo.dot_number,
        legal_name: carrierInfo.legal_name,
        validation_details: validationDetails
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const carrierController = new CarrierController();
export default carrierController;

