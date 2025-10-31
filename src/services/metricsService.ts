/**
 * MetricsService - Analytics and metrics data aggregation
 * Reads from pre-generated mock metrics data and filters/aggregates as needed
 */

import { CarrierValidationMetrics, LoadMatchingMetrics, OverviewMetrics, BusinessImpactMetrics } from '../models/dtos/MetricsAnalyticsDTO';
import { MetricsFilters } from '../api/controllers/metricsController';
import * as fs from 'fs';
import * as path from 'path';

interface MetricsDataStore {
  metadata: {
    generatedAt: string;
    startDate: string;
    endDate: string;
    daysGenerated: number;
    carrierCount: number;
  };
  validations: Array<{
    id: string;
    timestamp: string;
    carrierId: string;
    carrierName: string;
    dotNumber: string;
    success: boolean;
    validationTimeMs: number;
    failureReason?: string;
  }>;
  assignments: Array<{
    id: string;
    timestamp: string;
    loadId: string;
    carrierId: string;
    carrierName: string;
    matched: boolean;
    pickupCity: string;
    pickupState: string;
    deliveryCity: string;
    deliveryState: string;
    distanceToPickupMiles: number;
    feasibilityScore: number;
    commodityType: string;
  }>;
  offers: Array<{
    id: string;
    timestamp: string;
    carrierId: string;
    carrierName: string;
    commodityType: string;
    listedLoadBoardRate: number;
    finalNegotiatedRate: number;
    ratePerLoad: number;
    accepted: boolean;
    revenue: number;
  }>;
}

class MetricsService {
  private metricsData: MetricsDataStore | null = null;

  /**
   * Load metrics data from file
   */
  private loadMetricsData(): MetricsDataStore {
    if (this.metricsData) {
      return this.metricsData;
    }

    const dataPath = path.join(__dirname, '../../data/mock-metrics-data.json');
    
    try {
      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      this.metricsData = JSON.parse(fileContent);
      return this.metricsData!;
    } catch (error) {
      console.error('Error loading metrics data:', error);
      // Return empty data structure if file doesn't exist
      return {
        metadata: {
          generatedAt: new Date().toISOString(),
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          daysGenerated: 0,
          carrierCount: 0,
        },
        validations: [],
        assignments: [],
        offers: [],
      };
    }
  }

  /**
   * Filter events by date range and carrier
   */
  private filterEvents<T extends { timestamp: string; carrierId: string }>(
    events: T[],
    filters?: MetricsFilters
  ): T[] {
    return events.filter(event => {
      const eventDate = new Date(event.timestamp);
      const eventDateStr = eventDate.toISOString().split('T')[0];
      
      // Filter by date range (using date strings for consistent comparison)
      if (filters?.startDate) {
        if (eventDateStr < filters.startDate) return false;
      }
      
      if (filters?.endDate) {
        if (eventDateStr > filters.endDate) return false;
      }
      
      // Filter by carrier
      if (filters?.carrierId && event.carrierId !== filters.carrierId) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get carrier validation metrics from real data
   */
  async getCarrierValidationMetrics(filters?: MetricsFilters): Promise<CarrierValidationMetrics> {
    const data = this.loadMetricsData();
    const filteredValidations = this.filterEvents(data.validations, filters);
    
    const totalCalls = filteredValidations.length;
    const successfulCalls = filteredValidations.filter(v => v.success).length;
    const failedCalls = totalCalls - successfulCalls;
    
    // Calculate success rate
    const successRate = totalCalls > 0 
      ? Math.min(100, Math.round((successfulCalls / totalCalls) * 100 * 10) / 10)
      : 0;
    
    // Calculate average validation time
    const totalValidationTime = filteredValidations.reduce((sum, v) => sum + v.validationTimeMs, 0);
    const averageValidationTimeMs = totalCalls > 0 
      ? Math.round(totalValidationTime / totalCalls)
      : 0;
    
    // Aggregate failure reasons
    const failureReasonMap = new Map<string, number>();
    filteredValidations
      .filter(v => !v.success && v.failureReason)
      .forEach(v => {
        const count = failureReasonMap.get(v.failureReason!) || 0;
        failureReasonMap.set(v.failureReason!, count + 1);
      });
    
    const failureReasons = Array.from(failureReasonMap.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: failedCalls > 0 ? Math.round((count / failedCalls) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
    
    // Generate time series
    const timeSeries = this.aggregateTimeSeriesData(
      filteredValidations,
      filters,
      (validation) => ({
        successful: validation.success ? 1 : 0,
        failed: validation.success ? 0 : 1,
      })
    );
    
    return {
      totalCalls,
      successRate,
      averageValidationTimeMs,
      failureReasons,
      timeSeries,
    };
  }

  /**
   * Get load matching metrics from real data
   */
  async getLoadMatchingMetrics(filters?: MetricsFilters): Promise<LoadMatchingMetrics> {
    const data = this.loadMetricsData();
    const filteredAssignments = this.filterEvents(data.assignments, filters);
    
    const totalLoadsMatched = filteredAssignments.filter(a => a.matched).length;
    const availableLoads = filteredAssignments.length;
    const loadsWithCarriers = totalLoadsMatched;
    
    // Calculate match success rate
    const matchSuccessRate = availableLoads > 0
      ? Math.min(100, Math.round((totalLoadsMatched / availableLoads) * 100 * 10) / 10)
      : 0;
    
    // Calculate coverage rate
    const coverageRate = availableLoads > 0
      ? Math.min(100, Math.round((loadsWithCarriers / availableLoads) * 100 * 10) / 10)
      : 0;
    
    // Calculate average distance to pickup
    const totalDistance = filteredAssignments.reduce((sum, a) => sum + a.distanceToPickupMiles, 0);
    const averageDistanceToPickupMiles = filteredAssignments.length > 0
      ? Math.round(totalDistance / filteredAssignments.length)
      : 0;
    
    // Calculate average feasibility score
    const totalFeasibility = filteredAssignments.reduce((sum, a) => sum + a.feasibilityScore, 0);
    const averageFeasibilityScore = filteredAssignments.length > 0
      ? Math.round((totalFeasibility / filteredAssignments.length) * 100) / 100
      : 0;
    
    // Aggregate geographic distribution
    const locationMap = new Map<string, { loadCount: number; matchCount: number }>();
    filteredAssignments.forEach(assignment => {
      const key = `${assignment.pickupState}:${assignment.pickupCity}`;
      const current = locationMap.get(key) || { loadCount: 0, matchCount: 0 };
      current.loadCount++;
      if (assignment.matched) {
        current.matchCount++;
      }
      locationMap.set(key, current);
    });
    
    const geographicDistribution = Array.from(locationMap.entries())
      .map(([key, data]) => {
        const [state, city] = key.split(':');
        return {
          state,
          city,
          loadCount: data.loadCount,
          matchCount: data.matchCount,
        };
      })
      .sort((a, b) => b.loadCount - a.loadCount)
      .slice(0, 10); // Top 10 locations
    
    // Aggregate feasibility score distribution
    const scoreRanges = [
      { range: '0.9-1.0', min: 0.9, max: 1.0, count: 0 },
      { range: '0.8-0.9', min: 0.8, max: 0.9, count: 0 },
      { range: '0.7-0.8', min: 0.7, max: 0.8, count: 0 },
      { range: '0.6-0.7', min: 0.6, max: 0.7, count: 0 },
      { range: '0.5-0.6', min: 0.5, max: 0.6, count: 0 },
      { range: '<0.5', min: 0, max: 0.5, count: 0 },
    ];
    
    filteredAssignments.forEach(assignment => {
      const score = assignment.feasibilityScore;
      const range = scoreRanges.find(r => score >= r.min && score <= r.max);
      if (range) {
        range.count++;
      }
    });
    
    const feasibilityScoreDistribution = scoreRanges.map(({ range, count }) => ({
      range,
      count,
    }));
    
    // Generate time series
    const timeSeries = this.aggregateTimeSeriesData(
      filteredAssignments,
      filters,
      (assignment) => ({
        matched: assignment.matched ? 1 : 0,
        available: 1,
      })
    );
    
    return {
      totalLoadsMatched,
      matchSuccessRate,
      averageDistanceToPickupMiles,
      averageFeasibilityScore,
      availableLoads,
      loadsWithCarriers,
      coverageRate,
      geographicDistribution,
      feasibilityScoreDistribution,
      timeSeries,
    };
  }

  /**
   * Get overview metrics from real data
   */
  async getOverviewMetrics(filters?: MetricsFilters): Promise<OverviewMetrics> {
    const carrierMetrics = await this.getCarrierValidationMetrics(filters);
    const loadMetrics = await this.getLoadMatchingMetrics(filters);
    
    const data = this.loadMetricsData();
    
    // Get unique carriers from filtered data
    const uniqueCarriers = new Set<string>();
    if (!filters?.carrierId) {
      // Count all carriers with activity
      this.filterEvents(data.validations, filters).forEach(v => uniqueCarriers.add(v.carrierId));
      this.filterEvents(data.assignments, filters).forEach(a => uniqueCarriers.add(a.carrierId));
      this.filterEvents(data.offers, filters).forEach(o => uniqueCarriers.add(o.carrierId));
    } else {
      // Single carrier selected
      uniqueCarriers.add(filters.carrierId);
    }
    
    // Generate recent activity from all events
    const recentActivity = this.generateRecentActivity(filters);
    
    return {
      totalCarrierValidations: carrierMetrics.totalCalls,
      validationSuccessRate: carrierMetrics.successRate,
      totalLoadAssignments: loadMetrics.totalLoadsMatched,
      assignmentSuccessRate: loadMetrics.matchSuccessRate,
      averageMatchScore: loadMetrics.averageFeasibilityScore,
      activeCarriers: uniqueCarriers.size,
      availableLoads: loadMetrics.availableLoads,
      recentActivity,
    };
  }

  /**
   * Get business impact metrics from real data
   */
  async getBusinessImpactMetrics(filters?: MetricsFilters): Promise<BusinessImpactMetrics> {
    const data = this.loadMetricsData();
    const filteredOffers = this.filterEvents(data.offers, filters);
    
    const totalLoadsOffered = filteredOffers.length;
    const totalLoadsAccepted = filteredOffers.filter(o => o.accepted).length;
    
    // Calculate total revenue
    const totalRevenue = filteredOffers
      .filter(o => o.accepted)
      .reduce((sum, o) => sum + o.revenue, 0);
    
    // Calculate average revenue per load
    const averageRevenuePerLoad = totalLoadsAccepted > 0
      ? Math.round(totalRevenue / totalLoadsAccepted)
      : 0;
    
    // Calculate carrier acceptance rate
    const carrierAcceptanceRate = totalLoadsOffered > 0
      ? Math.min(100, Math.round((totalLoadsAccepted / totalLoadsOffered) * 100 * 10) / 10)
      : 0;
    
    // Calculate negotiation margin (difference between listed and negotiated rates)
    const acceptedOffers = filteredOffers.filter(o => o.accepted);
    const totalNegotiationMargin = acceptedOffers.reduce((sum, o) => {
      return sum + (o.listedLoadBoardRate - o.finalNegotiatedRate);
    }, 0);
    
    // Calculate average negotiation margin percentage
    const totalMarginPercent = acceptedOffers.reduce((sum, o) => {
      const marginPercent = o.listedLoadBoardRate > 0 
        ? ((o.listedLoadBoardRate - o.finalNegotiatedRate) / o.listedLoadBoardRate) * 100
        : 0;
      return sum + marginPercent;
    }, 0);
    
    const averageNegotiationMarginPercent = acceptedOffers.length > 0
      ? Math.round(totalMarginPercent / acceptedOffers.length * 10) / 10
      : 0;
    
    // Generate revenue time series
    const revenueTimeSeries = this.aggregateTimeSeriesData(
      filteredOffers,
      filters,
      (offer) => ({
        revenue: offer.accepted ? offer.revenue : 0,
        loadsAccepted: offer.accepted ? 1 : 0,
      })
    );
    
    // Generate negotiation margin time series
    const negotiationMarginTimeSeries = this.aggregateTimeSeriesData(
      filteredOffers,
      filters,
      (offer) => {
        if (!offer.accepted) {
          return { totalMargin: 0, marginCount: 0, totalPercent: 0 };
        }
        const margin = offer.listedLoadBoardRate - offer.finalNegotiatedRate;
        const marginPercent = offer.listedLoadBoardRate > 0
          ? ((offer.listedLoadBoardRate - offer.finalNegotiatedRate) / offer.listedLoadBoardRate) * 100
          : 0;
        return {
          totalMargin: margin,
          marginCount: 1,
          totalPercent: marginPercent,
        };
      }
    ).map(item => ({
      date: item.date,
      totalMargin: item.totalMargin,
      averageMarginPercent: item.marginCount > 0 
        ? Math.round((item.totalPercent / item.marginCount) * 10) / 10
        : 0,
    }));
    
    // Aggregate top carriers by revenue
    const carrierRevenueMap = new Map<string, {
      carrierName: string;
      loadsAccepted: number;
      totalRevenue: number;
    }>();
    
    filteredOffers
      .filter(o => o.accepted)
      .forEach(offer => {
        const current = carrierRevenueMap.get(offer.carrierId) || {
          carrierName: offer.carrierName,
          loadsAccepted: 0,
          totalRevenue: 0,
        };
        current.loadsAccepted++;
        current.totalRevenue += offer.revenue;
        carrierRevenueMap.set(offer.carrierId, current);
      });
    
    const topCarriersByRevenue = Array.from(carrierRevenueMap.entries())
      .map(([mcNumber, data]) => ({
        carrier: data.carrierName,
        mcNumber,
        loadsAccepted: data.loadsAccepted,
        totalRevenue: data.totalRevenue,
        averageRate: Math.round(data.totalRevenue / data.loadsAccepted),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5); // Top 5 carriers
    
    // Aggregate acceptance by load type (commodity)
    const commodityMap = new Map<string, {
      offered: number;
      accepted: number;
      totalRevenue: number;
    }>();
    
    filteredOffers.forEach(offer => {
      const current = commodityMap.get(offer.commodityType) || {
        offered: 0,
        accepted: 0,
        totalRevenue: 0,
      };
      current.offered++;
      if (offer.accepted) {
        current.accepted++;
        current.totalRevenue += offer.revenue;
      }
      commodityMap.set(offer.commodityType, current);
    });
    
    const acceptanceByLoadType = Array.from(commodityMap.entries())
      .map(([commodityType, data]) => ({
        commodityType,
        offered: data.offered,
        accepted: data.accepted,
        acceptanceRate: data.offered > 0
          ? Math.min(100, Math.round((data.accepted / data.offered) * 100 * 10) / 10)
          : 0,
        totalRevenue: data.totalRevenue,
      }))
      .sort((a, b) => b.offered - a.offered);
    
    return {
      totalRevenue,
      averageRevenuePerLoad,
      totalLoadsOffered,
      totalLoadsAccepted,
      carrierAcceptanceRate,
      averageNegotiationMarginPercent,
      totalNegotiationMargin,
      revenueTimeSeries,
      negotiationMarginTimeSeries,
      topCarriersByRevenue,
      acceptanceByLoadType,
    };
  }

  /**
   * Helper: Aggregate events into time series data
   */
  private aggregateTimeSeriesData<T extends { timestamp: string }, R extends Record<string, number>>(
    events: T[],
    filters: MetricsFilters | undefined,
    aggregator: (event: T) => R
  ): Array<R & { date: string }> {
    // Determine date range
    let startDate: Date;
    let endDate: Date;
    
    if (filters?.startDate && filters?.endDate) {
      startDate = new Date(filters.startDate + 'T00:00:00.000Z');
      endDate = new Date(filters.endDate + 'T23:59:59.999Z');
    } else if (filters?.startDate) {
      startDate = new Date(filters.startDate + 'T00:00:00.000Z');
      endDate = new Date();
    } else if (filters?.endDate) {
      const data = this.loadMetricsData();
      startDate = new Date(data.metadata.startDate);
      endDate = new Date(filters.endDate + 'T23:59:59.999Z');
    } else {
      // Use data's date range
      const data = this.loadMetricsData();
      startDate = new Date(data.metadata.startDate);
      endDate = new Date(data.metadata.endDate);
    }
    
    // Normalize to UTC date strings for consistency
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Create a map of dates to aggregated values
    const dateMap = new Map<string, R>();
    
    // Initialize all dates in range with zero values
    const currentDate = new Date(startDateStr + 'T00:00:00.000Z');
    const finalDate = new Date(endDateStr + 'T00:00:00.000Z');
    
    // Get a sample aggregation structure to initialize with zeros
    let zeroValues: R = {} as R;
    if (events.length > 0) {
      const sampleAggregation = aggregator(events[0]);
      zeroValues = Object.keys(sampleAggregation).reduce((acc, key) => {
        acc[key] = 0;
        return acc;
      }, {} as any);
    }
    
    while (currentDate <= finalDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateMap.set(dateStr, { ...zeroValues });
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    // Aggregate events by date
    events.forEach(event => {
      const eventDate = new Date(event.timestamp);
      const dateStr = eventDate.toISOString().split('T')[0];
      
      const current = dateMap.get(dateStr);
      if (current) {
        const aggregated = aggregator(event);
        Object.keys(aggregated).forEach(key => {
          (current as any)[key] += aggregated[key];
        });
      }
    });
    
    // Convert to array and sort by date
    return Array.from(dateMap.entries())
      .map(([date, values]) => ({
        date,
        ...values,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Helper: Generate recent activity from events
   */
  private generateRecentActivity(filters?: MetricsFilters): Array<{
    timestamp: string;
    type: 'validation' | 'assignment';
    carrier?: string;
    load?: number;
    success: boolean;
  }> {
    const data = this.loadMetricsData();
    
    const validations = this.filterEvents(data.validations, filters);
    const assignments = this.filterEvents(data.assignments, filters);
    
    // Combine and format both types of events
    const allEvents: Array<{
      timestamp: string;
      type: 'validation' | 'assignment';
      carrier?: string;
      load?: number;
      success: boolean;
    }> = [
      ...validations.map(v => ({
        timestamp: v.timestamp,
        type: 'validation' as const,
        carrier: v.carrierId,
        success: v.success,
      })),
      ...assignments.map(a => ({
        timestamp: a.timestamp,
        type: 'assignment' as const,
        carrier: a.carrierId,
        load: parseInt(a.loadId.replace('LOAD-', '')),
        success: a.matched,
      })),
    ];
    
    // Sort by timestamp descending and take top 10
    return allEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }
}

export const metricsService = new MetricsService();
