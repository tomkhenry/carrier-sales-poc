/**
 * MetricsAnalyticsDTO - Data Transfer Objects for Analytics Dashboard
 */

export interface CarrierValidationMetrics {
  totalCalls: number;
  successRate: number;
  averageValidationTimeMs: number;
  failureReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  timeSeries: {
    date: string;
    successful: number;
    failed: number;
  }[];
}

export interface LoadMatchingMetrics {
  totalLoadsMatched: number;
  matchSuccessRate: number;
  averageDistanceToPickupMiles: number;
  averageFeasibilityScore: number;
  availableLoads: number;
  loadsWithCarriers: number;
  coverageRate: number;
  geographicDistribution: {
    state: string;
    city: string;
    loadCount: number;
    matchCount: number;
  }[];
  feasibilityScoreDistribution: {
    range: string;
    count: number;
  }[];
  timeSeries: {
    date: string;
    matched: number;
    available: number;
  }[];
}

export interface OverviewMetrics {
  totalCarrierValidations: number;
  validationSuccessRate: number;
  totalLoadAssignments: number;
  assignmentSuccessRate: number;
  averageMatchScore: number;
  activeCarriers: number;
  availableLoads: number;
  recentActivity: {
    timestamp: string;
    type: 'validation' | 'assignment';
    carrier?: string;
    load?: number;
    success: boolean;
  }[];
}

export interface BusinessImpactMetrics {
  totalRevenue: number;
  averageRevenuePerLoad: number;
  totalLoadsOffered: number;
  totalLoadsAccepted: number;
  carrierAcceptanceRate: number;
  averageNegotiationMarginPercent: number;
  totalNegotiationMargin: number;
  revenueTimeSeries: {
    date: string;
    revenue: number;
    loadsAccepted: number;
  }[];
  negotiationMarginTimeSeries: {
    date: string;
    averageMarginPercent: number;
    totalMargin: number;
  }[];
  topCarriersByRevenue: {
    carrier: string;
    mcNumber: string;
    loadsAccepted: number;
    totalRevenue: number;
    averageRate: number;
  }[];
  acceptanceByLoadType: {
    commodityType: string;
    offered: number;
    accepted: number;
    acceptanceRate: number;
    totalRevenue: number;
  }[];
}

