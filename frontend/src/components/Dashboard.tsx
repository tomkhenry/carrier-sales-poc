/**
 * Dashboard - Main analytics dashboard layout
 */

import React, { useEffect, useState } from 'react';
import { apiService, ApiFilters } from '../services/apiService';
import type { CarrierValidationMetrics, LoadMatchingMetrics, OverviewMetrics, BusinessImpactMetrics } from '../types/metrics';
import { CarrierMetrics } from './CarrierMetrics';
import { LoadMatchingMetricsPanel } from './LoadMatchingMetrics';
import { BusinessImpactMetricsPanel } from './BusinessImpactMetrics';
import { MetricCard } from './MetricCard';
import { Sidebar } from './Sidebar';
import { FilterBar, FilterState } from './FilterBar';

export const Dashboard: React.FC = () => {
  const [carrierMetrics, setCarrierMetrics] = useState<CarrierValidationMetrics | null>(null);
  const [loadMetrics, setLoadMetrics] = useState<LoadMatchingMetrics | null>(null);
  const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetrics | null>(null);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessImpactMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'carrier' | 'load' | 'business'>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    timeRange: '30days',
    startDate: '',
    endDate: '',
    carrierId: '',
  });
  const [availableCarriers, setAvailableCarriers] = useState<Array<{ id: string; name: string; mcNumber: string }>>([]);

  useEffect(() => {
    fetchCarriers();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchCarriers = async () => {
    try {
      const carriers = await apiService.getCarriers();
      setAvailableCarriers(carriers);
    } catch (err) {
      console.error('Error fetching carriers:', err);
      // Continue with empty carrier list
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Convert FilterState to ApiFilters
      const apiFilters: ApiFilters = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        carrierId: filters.carrierId || undefined,
      };

      const [carrier, load, overview, business] = await Promise.all([
        apiService.getCarrierValidationMetrics(apiFilters),
        apiService.getLoadMatchingMetrics(apiFilters),
        apiService.getOverviewMetrics(apiFilters),
        apiService.getBusinessImpactMetrics(apiFilters),
      ]);

      setCarrierMetrics(carrier);
      setLoadMetrics(load);
      setOverviewMetrics(overview);
      setBusinessMetrics(business);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to load metrics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <div
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-20' : 'ml-64'
          } min-h-screen bg-gray-50 flex items-center justify-center`}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <div
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-20' : 'ml-64'
          } min-h-screen bg-gray-50 flex items-center justify-center`}
        >
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-gray-800 text-xl mb-2">Error Loading Dashboard</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Freight Brokerage Analytics Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Monitor carrier sales and load matching performance
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          availableCarriers={availableCarriers}
        />

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && overviewMetrics && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Business Overview</h2>
              <p className="text-gray-600">Key performance indicators at a glance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Total Validations"
                value={overviewMetrics.totalCarrierValidations.toLocaleString()}
                subtitle={`${overviewMetrics.validationSuccessRate}% success rate`}
                colorClass="bg-blue-500"
              />
              <MetricCard
                title="Load Assignments"
                value={overviewMetrics.totalLoadAssignments.toLocaleString()}
                subtitle={`${overviewMetrics.assignmentSuccessRate}% success rate`}
                colorClass="bg-green-500"
              />
              <MetricCard
                title="Active Carriers"
                value={overviewMetrics.activeCarriers.toLocaleString()}
                subtitle="In system"
                colorClass="bg-purple-500"
              />
              <MetricCard
                title="Available Loads"
                value={overviewMetrics.availableLoads.toLocaleString()}
                subtitle="Ready for assignment"
                colorClass="bg-yellow-500"
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {overviewMetrics.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.success ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {activity.type === 'validation' ? 'Carrier Validation' : 'Load Assignment'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {activity.carrier}
                          {activity.load && ` → Load #${activity.load}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Average Match Score</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full"
                        style={{ width: `${overviewMetrics.averageMatchScore * 100}%` }}
                      />
                    </div>
                    <p className="text-xl font-bold text-gray-800">
                      {overviewMetrics.averageMatchScore.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">System Health</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-xl font-bold text-gray-800">All Systems Operational</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'carrier' && carrierMetrics && (
          <CarrierMetrics metrics={carrierMetrics} />
        )}

        {activeTab === 'load' && loadMetrics && (
          <LoadMatchingMetricsPanel metrics={loadMetrics} />
        )}

        {activeTab === 'business' && businessMetrics && (
          <BusinessImpactMetricsPanel metrics={businessMetrics} />
        )}
        </main>
      </div>
    </div>
  );
};

