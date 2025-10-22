import axios, { AxiosInstance } from 'axios';
import { appConfig } from '../config/app.config';
import { logger } from '../utils/logger';
import { CargoTypeCode, getCargoTypeIdFromDescription } from '../constants/cargoTypes';

/**
 * FMCSA API Service
 * Handles all interactions with the FMCSA API
 * 
 * API Flow:
 * 1. MC Number → docket-number endpoint → Extract DOT Number
 * 2. DOT Number → authority, operation-classification, cargo-carried endpoints
 */
export class FMCSAService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: appConfig.fmcsa.baseUrl,
      timeout: appConfig.fmcsa.timeout,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Add webKey as query parameter to all requests if API key is provided
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add webKey query parameter if API key is configured
        if (appConfig.fmcsa.apiKey) {
          config.params = {
            ...config.params,
            webKey: appConfig.fmcsa.apiKey
          };
        }
        
        logger.debug(`FMCSA API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('FMCSA API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.debug(`FMCSA API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response) {
          logger.error(`FMCSA API Error: ${error.response.status} - ${error.response.data?.message || error.message}`);
        } else if (error.request) {
          logger.error('FMCSA API Error: No response received', error.message);
        } else {
          logger.error('FMCSA API Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get carrier information by MC number (docket-number endpoint)
   * This is the entry point - returns DOT number and basic carrier info
   * 
   * @param mcNumber - MC number (e.g., "1515")
   * @returns Carrier data including DOT number
   */
  async getDocketNumberByMC(mcNumber: string): Promise<any> {
    try {
      logger.info(`Fetching docket info for MC: ${mcNumber}`);
      const response = await this.axiosInstance.get(`/docket-number/${mcNumber}`);
      
      if (response.data?.content && response.data.content.length > 0) {
        return response.data.content[0].carrier;
      }
      
      throw new Error(`No carrier found for MC number: ${mcNumber}`);
    } catch (error: any) {
      logger.error(`Error fetching docket number for MC ${mcNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get carrier authority information by DOT number
   * 
   * @param dotNumber - DOT number (e.g., "44110")
   * @returns Authority information
   */
  async getAuthority(dotNumber: string): Promise<any> {
    try {
      logger.info(`Fetching authority for DOT: ${dotNumber}`);
      const response = await this.axiosInstance.get(`/${dotNumber}/authority`);
      return response.data.content || [];
    } catch (error: any) {
      logger.error(`Error fetching authority for DOT ${dotNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get operation classification by DOT number
   * 
   * @param dotNumber - DOT number
   * @returns Array of operation classifications
   */
  async getOperationClassification(dotNumber: string): Promise<string[]> {
    try {
      logger.info(`Fetching operation classification for DOT: ${dotNumber}`);
      const response = await this.axiosInstance.get(`/${dotNumber}/operation-classification`);
      
      if (response.data?.content) {
        return response.data.content.map((item: any) => item.operationClassDesc);
      }
      
      return [];
    } catch (error: any) {
      logger.error(`Error fetching operation classification for DOT ${dotNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get cargo carried types by DOT number
   * Used for load matching
   * 
   * @param dotNumber - DOT number
   * @returns Array of cargo type IDs
   */
  async getCargoCarried(dotNumber: string): Promise<CargoTypeCode[]> {
    try {
      logger.info(`Fetching cargo carried for DOT: ${dotNumber}`);
      const response = await this.axiosInstance.get(`/${dotNumber}/cargo-carried`);
      
      if (response.data?.content) {
        const cargoIds: CargoTypeCode[] = [];
        
        for (const item of response.data.content) {
          // Try to use cargoClassId first (direct from API)
          if (item.id?.cargoClassId) {
            cargoIds.push(item.id.cargoClassId as CargoTypeCode);
          } 
          // Fallback: convert description to ID
          else if (item.cargoClassDesc) {
            const cargoId = getCargoTypeIdFromDescription(item.cargoClassDesc);
            if (cargoId) {
              cargoIds.push(cargoId);
            } else {
              logger.warn(`Unknown cargo type description: ${item.cargoClassDesc}`);
            }
          }
        }
        
        return cargoIds;
      }
      
      return [];
    } catch (error: any) {
      logger.error(`Error fetching cargo carried for DOT ${dotNumber}:`, error);
      throw error;
    }
  }

  /**
   * Helper: Get DOT number from MC number with caching support
   * Checks cache first, falls back to API call
   * 
   * @param mcNumber - MC number
   * @param cacheCheck - Function to check cache for existing carrier
   * @returns DOT number
   */
  async getDotNumberFromMC(
    mcNumber: string,
    cacheCheck?: (mc: string) => Promise<string | null>
  ): Promise<string> {
    // Check cache if provided
    if (cacheCheck) {
      const cachedDot = await cacheCheck(mcNumber);
      if (cachedDot) {
        logger.info(`Using cached DOT number for MC ${mcNumber}: ${cachedDot}`);
        return cachedDot;
      }
    }

    // Fetch from API
    const docketInfo = await this.getDocketNumberByMC(mcNumber);
    return docketInfo.dotNumber.toString();
  }
}

// Export singleton instance
export const fmcsaService = new FMCSAService();
export default fmcsaService;

