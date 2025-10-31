/**
 * MetricsController - Handles analytics dashboard metrics requests
 */

import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../../services/metricsService';
import { logger } from '../../utils/logger';

export interface MetricsFilters {
  startDate?: string;
  endDate?: string;
  carrierId?: string;
}

class MetricsController {
  /**
   * Extract filter parameters from request query
   */
  private extractFilters(req: Request): MetricsFilters {
    const filters: MetricsFilters = {};
    
    if (req.query.startDate && typeof req.query.startDate === 'string') {
      filters.startDate = req.query.startDate;
    }
    
    if (req.query.endDate && typeof req.query.endDate === 'string') {
      filters.endDate = req.query.endDate;
    }
    
    if (req.query.carrierId && typeof req.query.carrierId === 'string') {
      filters.carrierId = req.query.carrierId;
    }
    
    return filters;
  }

  /**
   * Get carrier validation metrics
   * GET /api/metrics/carrier-validation?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&carrierId=xxx
   */
  async getCarrierValidationMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = this.extractFilters(req);
      logger.info('Fetching carrier validation metrics', { filters });
      
      const metrics = await metricsService.getCarrierValidationMetrics(filters);
      
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Error fetching carrier validation metrics:', error);
      next(error);
    }
  }

  /**
   * Get load matching metrics
   * GET /api/metrics/load-matching?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&carrierId=xxx
   */
  async getLoadMatchingMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = this.extractFilters(req);
      logger.info('Fetching load matching metrics', { filters });
      
      const metrics = await metricsService.getLoadMatchingMetrics(filters);
      
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Error fetching load matching metrics:', error);
      next(error);
    }
  }

  /**
   * Get overview metrics
   * GET /api/metrics/overview?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&carrierId=xxx
   */
  async getOverviewMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = this.extractFilters(req);
      logger.info('Fetching overview metrics', { filters });
      
      const metrics = await metricsService.getOverviewMetrics(filters);
      
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Error fetching overview metrics:', error);
      next(error);
    }
  }

  /**
   * Get business impact metrics
   * GET /api/metrics/business-impact?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&carrierId=xxx
   */
  async getBusinessImpactMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = this.extractFilters(req);
      logger.info('Fetching business impact metrics', { filters });
      
      const metrics = await metricsService.getBusinessImpactMetrics(filters);
      
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Error fetching business impact metrics:', error);
      next(error);
    }
  }
}

export const metricsController = new MetricsController();

