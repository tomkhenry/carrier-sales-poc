import crypto from 'crypto';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

export interface ApiKey {
  key: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  isActive: boolean;
  metadata?: {
    description?: string;
    createdBy?: string;
    environment?: string;
  };
}

export interface ApiKeyValidationResult {
  valid: boolean;
  keyInfo?: ApiKey;
  reason?: string;
}

interface ApiKeyStorage {
  apiKeys: ApiKey[];
}

/**
 * Service for managing API keys
 * Handles generation, validation, and storage of API keys
 */
export class ApiKeyService {
  private static instance: ApiKeyService;
  private readonly storageKey = 'apiKeys';

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ApiKeyService {
    if (!ApiKeyService.instance) {
      ApiKeyService.instance = new ApiKeyService();
    }
    return ApiKeyService.instance;
  }

  /**
   * Generate a new API key
   * Format: ics_live_<32 random chars> or ics_test_<32 random chars>
   */
  public async generateApiKey(
    name: string,
    isTest: boolean = false,
    metadata?: ApiKey['metadata']
  ): Promise<ApiKey> {
    // Generate secure random key
    const randomBytes = crypto.randomBytes(24);
    const randomString = randomBytes.toString('base64')
      .replace(/\+/g, '')
      .replace(/\//g, '')
      .replace(/=/g, '')
      .substring(0, 32);

    const prefix = isTest ? 'ics_test_' : 'ics_live_';
    const key = `${prefix}${randomString}`;

    const apiKey: ApiKey = {
      key,
      name,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      isActive: true,
      metadata: metadata || {}
    };

    // Store the API key
    await this.storeApiKey(apiKey);

    logger.info('API key generated', {
      name,
      keyPrefix: key.substring(0, 20) + '...',
      isTest
    });

    return apiKey;
  }

  /**
   * Validate an API key
   */
  public async validateApiKey(key: string): Promise<ApiKeyValidationResult> {
    try {
      const storage = await this.getStorage();
      const apiKey = storage.apiKeys.find(k => k.key === key);

      if (!apiKey) {
        return {
          valid: false,
          reason: 'API key not found'
        };
      }

      if (!apiKey.isActive) {
        return {
          valid: false,
          reason: 'API key has been deactivated'
        };
      }

      // Update last used timestamp
      await this.updateLastUsed(key);

      return {
        valid: true,
        keyInfo: apiKey
      };
    } catch (error) {
      logger.error('Error validating API key', { error });
      return {
        valid: false,
        reason: 'Error validating API key'
      };
    }
  }

  /**
   * List all API keys (without exposing full key)
   */
  public async listApiKeys(): Promise<Omit<ApiKey, 'key'>[]> {
    const storage = await this.getStorage();
    return storage.apiKeys.map(({ key, ...rest }) => ({
      ...rest,
      keyPrefix: key.substring(0, 20) + '...'
    })) as any;
  }

  /**
   * Deactivate an API key
   */
  public async deactivateApiKey(keyOrName: string): Promise<boolean> {
    try {
      const storage = await this.getStorage();
      const index = storage.apiKeys.findIndex(
        k => k.key === keyOrName || k.name === keyOrName
      );

      if (index === -1) {
        return false;
      }

      storage.apiKeys[index].isActive = false;
      await this.saveStorage(storage);

      logger.info('API key deactivated', {
        name: storage.apiKeys[index].name
      });

      return true;
    } catch (error) {
      logger.error('Error deactivating API key', { error });
      return false;
    }
  }

  /**
   * Delete an API key permanently
   */
  public async deleteApiKey(keyOrName: string): Promise<boolean> {
    try {
      const storage = await this.getStorage();
      const initialLength = storage.apiKeys.length;

      storage.apiKeys = storage.apiKeys.filter(
        k => k.key !== keyOrName && k.name !== keyOrName
      );

      if (storage.apiKeys.length === initialLength) {
        return false; // No key was deleted
      }

      await this.saveStorage(storage);

      logger.info('API key deleted', { keyOrName });

      return true;
    } catch (error) {
      logger.error('Error deleting API key', { error });
      return false;
    }
  }

  /**
   * Store a new API key
   */
  private async storeApiKey(apiKey: ApiKey): Promise<void> {
    const storage = await this.getStorage();

    // Check for duplicate names
    const existingKey = storage.apiKeys.find(k => k.name === apiKey.name);
    if (existingKey) {
      throw new Error(`API key with name '${apiKey.name}' already exists`);
    }

    storage.apiKeys.push(apiKey);
    await this.saveStorage(storage);
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(key: string): Promise<void> {
    try {
      const storage = await this.getStorage();
      const apiKey = storage.apiKeys.find(k => k.key === key);

      if (apiKey) {
        apiKey.lastUsedAt = new Date().toISOString();
        await this.saveStorage(storage);
      }
    } catch (error) {
      // Don't fail validation if we can't update timestamp
      logger.error('Error updating last used timestamp', { error });
    }
  }

  /**
   * Get storage from file
   */
  private async getStorage(): Promise<ApiKeyStorage> {
    try {
      const dataDir = process.env.DATA_DIR || './data';
      const dbPath = path.join(dataDir, 'db.json');
      const fileContent = await fs.readFile(dbPath, 'utf8');
      const data = JSON.parse(fileContent);
      return {
        apiKeys: data.apiKeys || []
      };
    } catch (error) {
      logger.error('Error reading API key storage', { error });
      return { apiKeys: [] };
    }
  }

  /**
   * Save storage to file
   */
  private async saveStorage(storage: ApiKeyStorage): Promise<void> {
    try {
      const dataDir = process.env.DATA_DIR || './data';
      const dbPath = path.join(dataDir, 'db.json');
      const fileContent = await fs.readFile(dbPath, 'utf8');
      const data = JSON.parse(fileContent);
      data.apiKeys = storage.apiKeys;
      await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      logger.error('Error saving API key storage', { error });
      throw error;
    }
  }
}

