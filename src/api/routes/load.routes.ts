import { Router } from 'express';
import { body } from 'express-validator';
import { loadController } from '../controllers/loadController';
import { validate } from '../middleware/validation';
import { apiKeyAuth } from '../middleware/apiKeyAuth';
import { isValidMCNumber, isValidLocation, isValidCommodityType } from '../../utils/validators';

const router = Router();

/**
 * POST /api/load/assign-load
 * Assign best matching load to carrier
 * Requires API key authentication
 * Note: Equipment types removed as FMCSA doesn't provide this data
 */
router.post(
  '/assign-load',
  apiKeyAuth,
  validate([
    body('mc_number')
      .notEmpty()
      .withMessage('MC number is required')
      .custom((value) => {
        if (!isValidMCNumber(value)) {
          throw new Error('Invalid MC number format');
        }
        return true;
      }),
    body('current_location')
      .notEmpty()
      .withMessage('Current location is required')
      .custom((value) => {
        if (!isValidLocation(value)) {
          throw new Error('Invalid location format (expected: "City, State")');
        }
        return true;
      })
  ]),
  (req, res, next) => loadController.assignLoad(req, res, next)
);

/**
 * GET /api/load/available
 * Get all available loads
 * Requires API key authentication
 */
router.get(
  '/available',
  apiKeyAuth,
  (req, res, next) => loadController.getAvailableLoads(req, res, next)
);

/**
 * POST /api/load/create
 * Create a new load (for testing)
 * Requires API key authentication
 */
router.post(
  '/create',
  apiKeyAuth,
  validate([
    body('origin').notEmpty().withMessage('Origin is required'),
    body('destination').notEmpty().withMessage('Destination is required'),
    body('equipment_type').notEmpty().withMessage('Equipment type is required'),
    body('commodity_type')
      .notEmpty()
      .withMessage('Commodity type is required')
      .custom((value) => {
        if (!isValidCommodityType(value)) {
          throw new Error('Invalid commodity type ID (must be a valid cargo type code 1-30)');
        }
        return true;
      }),
    body('loadboard_rate').isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
    body('weight').isFloat({ min: 0 }).withMessage('Weight must be a positive number')
  ]),
  (req, res, next) => loadController.createLoad(req, res, next)
);

export default router;

