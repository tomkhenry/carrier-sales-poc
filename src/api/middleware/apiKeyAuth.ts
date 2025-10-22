import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { ApiKeyService } from '../../services/apiKeyService';

/**
 * Middleware to validate API key authentication
 * 
 * Checks for API key in:
 * 1. X-API-Key header
 * 2. Authorization: Bearer <key> header
 */
export const apiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract API key from headers
    const apiKeyFromHeader = req.header('X-API-Key');
    const authHeader = req.header('Authorization');
    const apiKeyFromBearer = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    const apiKey = apiKeyFromHeader || apiKeyFromBearer;

    // Check if API key is provided
    if (!apiKey) {
      logger.warn('API request without API key', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });

      res.status(401).json({
        success: false,
        error: 'API key required',
        message: 'Please provide an API key via X-API-Key header or Authorization: Bearer header'
      });
      return;
    }

    // Validate API key
    const apiKeyService = ApiKeyService.getInstance();
    const validationResult = await apiKeyService.validateApiKey(apiKey);

    if (!validationResult.valid) {
      logger.warn('Invalid API key attempt', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        reason: validationResult.reason
      });

      res.status(401).json({
        success: false,
        error: 'Invalid API key',
        message: validationResult.reason || 'The provided API key is invalid'
      });
      return;
    }

    // Attach API key info to request for downstream use
    (req as any).apiKey = validationResult.keyInfo;

    // Log successful authentication
    logger.info('API request authenticated', {
      keyName: validationResult.keyInfo?.name,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.error('Error in API key authentication', { error });
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred while validating your API key'
    });
  }
};

/**
 * Optional middleware that allows requests with or without API keys
 * but tracks authenticated vs unauthenticated requests
 */
export const optionalApiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKeyFromHeader = req.header('X-API-Key');
    const authHeader = req.header('Authorization');
    const apiKeyFromBearer = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    const apiKey = apiKeyFromHeader || apiKeyFromBearer;

    if (apiKey) {
      const apiKeyService = ApiKeyService.getInstance();
      const validationResult = await apiKeyService.validateApiKey(apiKey);

      if (validationResult.valid) {
        (req as any).apiKey = validationResult.keyInfo;
        logger.info('Optional auth: authenticated request', {
          keyName: validationResult.keyInfo?.name,
          path: req.path
        });
      } else {
        logger.warn('Optional auth: invalid key provided', {
          path: req.path,
          reason: validationResult.reason
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Error in optional API key authentication', { error });
    next(); // Continue anyway for optional auth
  }
};

