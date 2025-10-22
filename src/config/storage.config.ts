import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Storage configuration for file-based database
 */
export const storageConfig = {
  dataDir: process.env.DATA_DIR || './data',
  dbFile: 'db.json',
  
  /**
   * Get full path to database file
   */
  getDbPath(): string {
    return path.join(this.dataDir, this.dbFile);
  },

  /**
   * Cache TTL settings
   */
  cache: {
    carrierTTL: parseInt(process.env.CARRIER_CACHE_TTL || '86400') * 1000, // 24h in ms
  }
};

export default storageConfig;

