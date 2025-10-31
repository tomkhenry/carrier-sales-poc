/**
 * Metrics Routes - Analytics dashboard endpoints
 */

import { Router } from 'express';
import { metricsController } from '../controllers/metricsController';

const router = Router();

/**
 * GET /api/metrics/carrier-validation
 * Get carrier validation analytics
 */
router.get('/carrier-validation', metricsController.getCarrierValidationMetrics.bind(metricsController));

/**
 * GET /api/metrics/load-matching
 * Get load matching analytics
 */
router.get('/load-matching', metricsController.getLoadMatchingMetrics.bind(metricsController));

/**
 * GET /api/metrics/overview
 * Get overview metrics
 */
router.get('/overview', metricsController.getOverviewMetrics.bind(metricsController));

/**
 * GET /api/metrics/business-impact
 * Get business impact metrics
 */
router.get('/business-impact', metricsController.getBusinessImpactMetrics.bind(metricsController));

export default router;

