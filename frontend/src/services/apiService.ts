/**
 * API Service - Handles API calls to the backend
 */

import axios from 'axios';
import { CarrierValidationMetrics, LoadMatchingMetrics, OverviewMetrics, BusinessImpactMetrics } from '../types/metrics';

const API_BASE_URL = '/api/metrics';

export interface ApiFilters {
  startDate?: string;
  endDate?: string;
  carrierId?: string;
}

class ApiService {
  /**
   * Build query string from filters
   */
  private buildQueryParams(filters?: ApiFilters): string {
    if (!filters) return '';
    
    const params = new URLSearchParams();
    
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }
    
    if (filters.carrierId) {
      params.append('carrierId', filters.carrierId);
    }
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Fetch carrier validation metrics
   */
  async getCarrierValidationMetrics(filters?: ApiFilters): Promise<CarrierValidationMetrics> {
    const queryParams = this.buildQueryParams(filters);
    const response = await axios.get(`${API_BASE_URL}/carrier-validation${queryParams}`);
    return response.data.data;
  }

  /**
   * Fetch load matching metrics
   */
  async getLoadMatchingMetrics(filters?: ApiFilters): Promise<LoadMatchingMetrics> {
    const queryParams = this.buildQueryParams(filters);
    const response = await axios.get(`${API_BASE_URL}/load-matching${queryParams}`);
    return response.data.data;
  }

  /**
   * Fetch overview metrics
   */
  async getOverviewMetrics(filters?: ApiFilters): Promise<OverviewMetrics> {
    const queryParams = this.buildQueryParams(filters);
    const response = await axios.get(`${API_BASE_URL}/overview${queryParams}`);
    return response.data.data;
  }

  /**
   * Fetch business impact metrics
   */
  async getBusinessImpactMetrics(filters?: ApiFilters): Promise<BusinessImpactMetrics> {
    const queryParams = this.buildQueryParams(filters);
    const response = await axios.get(`${API_BASE_URL}/business-impact${queryParams}`);
    return response.data.data;
  }

  /**
   * Fetch list of carriers for filter dropdown
   */
  async getCarriers(): Promise<Array<{ id: string; name: string; mcNumber: string }>> {
    try {
      const response = await axios.get('/api/carrier/list');
      // Map carrier data to filter format
      return response.data.data.map((carrier: any) => ({
        id: carrier.mc_number || carrier.dot_number,
        name: carrier.legal_name || carrier.dba_name || 'Unknown Carrier',
        mcNumber: carrier.mc_number || 'N/A',
      }));
    } catch (error) {
      console.error('Error fetching carriers:', error);
      // Return empty array if API fails (graceful degradation)
      return [];
    }
  }
}

export const apiService = new ApiService();

