import dotenv from 'dotenv';

dotenv.config();

/**
 * Application-wide configuration
 */
export const appConfig = {
  // Server settings
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // FMCSA API settings
  fmcsa: {
    baseUrl: process.env.FMCSA_API_BASE_URL || 'https://mobile.fmcsa.dot.gov/qc/services/carriers',
    timeout: parseInt(process.env.FMCSA_API_TIMEOUT || '10000', 10),
    apiKey: process.env.FMCSA_API_KEY || '', // API key if required
  },
  
  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  // Cache settings
  cache: {
    carrierTTL: parseInt(process.env.CARRIER_CACHE_TTL || '86400', 10), // in seconds
  },
  
  // Development mode check
  isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  },
  
  // Production mode check
  isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
};

export default appConfig;

