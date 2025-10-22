import { Router } from 'express';
import { body } from 'express-validator';
import { carrierController } from '../controllers/carrierController';
import { validate } from '../middleware/validation';
import { apiKeyAuth } from '../middleware/apiKeyAuth';
import { isValidMCNumber } from '../../utils/validators';

const router = Router();

/**
 * POST /api/carrier/verify-carrier
 * Verify carrier eligibility
 * Requires API key authentication
 */
router.post(
  '/verify-carrier',
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
      })
  ]),
  (req, res, next) => carrierController.verifyCarrier(req, res, next)
);

export default router;

