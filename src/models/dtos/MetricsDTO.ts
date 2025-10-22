/**
 * MetricsDTO - Data Transfer Object for Metrics collection
 * ⚠️ FUTURE ENHANCEMENT - Out of scope for initial POC
 * 
 * This will be used for tracking system events and performance metrics
 */
export interface MetricsDTO {
  metric_id?: string;
  timestamp: Date;
  event_type: string;              // e.g., "carrier_verified", "load_assigned"
  carrier_mc?: string;
  load_id?: number;
  success: boolean;
  response_time_ms?: number;
  error_message?: string;
  metadata?: Record<string, any>;
}

