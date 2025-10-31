/**
 * FilterBar - Persistent filters for all dashboard views
 */

import React, { useState, useEffect } from 'react';

export interface FilterState {
  timeRange: string;
  startDate: string;
  endDate: string;
  carrierId: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableCarriers: Array<{ id: string; name: string; mcNumber: string }>;
}

const TIME_RANGES = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
  { value: 'all', label: 'All Time' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableCarriers,
}) => {
  const [showCustomDates, setShowCustomDates] = useState(filters.timeRange === 'custom');

  useEffect(() => {
    setShowCustomDates(filters.timeRange === 'custom');
  }, [filters.timeRange]);

  const handleTimeRangeChange = (timeRange: string) => {
    const newFilters = { ...filters, timeRange };
    
    // Auto-calculate date ranges for predefined options
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeRange) {
      case 'today':
        newFilters.startDate = today.toISOString().split('T')[0];
        newFilters.endDate = today.toISOString().split('T')[0];
        break;
      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        newFilters.startDate = sevenDaysAgo.toISOString().split('T')[0];
        newFilters.endDate = today.toISOString().split('T')[0];
        break;
      case '30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        newFilters.startDate = thirtyDaysAgo.toISOString().split('T')[0];
        newFilters.endDate = today.toISOString().split('T')[0];
        break;
      case '90days':
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        newFilters.startDate = ninetyDaysAgo.toISOString().split('T')[0];
        newFilters.endDate = today.toISOString().split('T')[0];
        break;
      case 'all':
        newFilters.startDate = '';
        newFilters.endDate = '';
        break;
      case 'custom':
        // Keep existing dates or set defaults
        if (!newFilters.startDate || !newFilters.endDate) {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          newFilters.startDate = thirtyDaysAgo.toISOString().split('T')[0];
          newFilters.endDate = today.toISOString().split('T')[0];
        }
        break;
    }
    
    onFilterChange(newFilters);
  };

  const handleCarrierChange = (carrierId: string) => {
    onFilterChange({ ...filters, carrierId });
  };

  const handleStartDateChange = (startDate: string) => {
    onFilterChange({ ...filters, startDate });
  };

  const handleEndDateChange = (endDate: string) => {
    onFilterChange({ ...filters, endDate });
  };

  const handleClearFilters = () => {
    onFilterChange({
      timeRange: '30days',
      startDate: '',
      endDate: '',
      carrierId: '',
    });
  };

  const hasActiveFilters = filters.carrierId !== '' || filters.timeRange !== '30days';

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-[106px] z-40">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter Icon */}
          <div className="flex items-center gap-2 text-gray-700">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="font-medium text-sm">Filters:</span>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="timeRange" className="text-sm text-gray-600">
              Time Range:
            </label>
            <select
              id="timeRange"
              value={filters.timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TIME_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range Inputs */}
          {showCustomDates && (
            <>
              <div className="flex items-center gap-2">
                <label htmlFor="startDate" className="text-sm text-gray-600">
                  From:
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={filters.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="endDate" className="text-sm text-gray-600">
                  To:
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={filters.endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Carrier Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="carrier" className="text-sm text-gray-600">
              Carrier:
            </label>
            <select
              id="carrier"
              value={filters.carrierId}
              onChange={(e) => handleCarrierChange(e.target.value)}
              className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
            >
              <option value="">All Carriers</option>
              {availableCarriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name} ({carrier.mcNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="ml-auto flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear Filters
            </button>
          )}
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.timeRange !== '30days' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {TIME_RANGES.find(r => r.value === filters.timeRange)?.label}
                {showCustomDates && filters.startDate && filters.endDate && 
                  `: ${filters.startDate} to ${filters.endDate}`
                }
              </span>
            )}
            {filters.carrierId && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {availableCarriers.find(c => c.id === filters.carrierId)?.name || 'Selected Carrier'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

