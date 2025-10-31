/**
 * LoadMatchingMetricsPanel - Load matching and assignment metrics panel
 */

import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { LoadMatchingMetrics } from '../types/metrics';
import { MetricCard } from './MetricCard';

interface LoadMatchingMetricsPanelProps {
  metrics: LoadMatchingMetrics;
}

export const LoadMatchingMetricsPanel: React.FC<LoadMatchingMetricsPanelProps> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Load Matching & Assignment Metrics</h2>
        <p className="text-gray-600">Track load assignment efficiency and matching performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Loads Matched"
          value={metrics.totalLoadsMatched.toLocaleString()}
          subtitle="Last 30 days"
          colorClass="bg-blue-500"
        />
        <MetricCard
          title="Match Success Rate"
          value={`${metrics.matchSuccessRate}%`}
          subtitle={`${metrics.loadsWithCarriers} of ${metrics.availableLoads} loads`}
          colorClass="bg-green-500"
        />
        <MetricCard
          title="Avg Distance to Pickup"
          value={`${Math.round(metrics.averageDistanceToPickupMiles)} mi`}
          subtitle="Proximity metric"
          colorClass="bg-yellow-500"
        />
        <MetricCard
          title="Avg Feasibility Score"
          value={metrics.averageFeasibilityScore.toFixed(2)}
          subtitle="Match quality"
          colorClass="bg-purple-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Load Assignment Trends (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.timeSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              />
              <Legend />
              <Line type="monotone" dataKey="matched" stroke="#10b981" strokeWidth={2} name="Matched" />
              <Line type="monotone" dataKey="available" stroke="#3b82f6" strokeWidth={2} name="Available" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Feasibility Score Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Feasibility Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.feasibilityScoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8b5cf6" name="Number of Matches" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Geographic Distribution - Top Freight Hubs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Loads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matched
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coverage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.geographicDistribution.map((location, index) => {
                const matchRate = Math.round((location.matchCount / location.loadCount) * 100);
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{location.city}</div>
                      <div className="text-sm text-gray-500">{location.state}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {location.loadCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {location.matchCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {matchRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${matchRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Coverage Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{metrics.availableLoads}</p>
            <p className="text-sm text-gray-600 mt-1">Available Loads</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{metrics.loadsWithCarriers}</p>
            <p className="text-sm text-gray-600 mt-1">Loads with Carriers</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{metrics.coverageRate}%</p>
            <p className="text-sm text-gray-600 mt-1">Overall Coverage Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

