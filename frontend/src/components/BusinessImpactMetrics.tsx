/**
 * BusinessImpactMetrics - Revenue and business impact metrics panel
 */

import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { BusinessImpactMetrics } from '../types/metrics';
import { MetricCard } from './MetricCard';

interface BusinessImpactMetricsProps {
  metrics: BusinessImpactMetrics;
}

export const BusinessImpactMetricsPanel: React.FC<BusinessImpactMetricsProps> = ({ metrics }) => {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Business Impact & Revenue Metrics</h2>
        <p className="text-gray-600">Track revenue performance and carrier acceptance rates</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          subtitle="Last 30 days"
          colorClass="bg-green-500"
        />
        <MetricCard
          title="Avg Revenue Per Load"
          value={formatCurrency(metrics.averageRevenuePerLoad)}
          subtitle="Per accepted load"
          colorClass="bg-blue-500"
        />
        <MetricCard
          title="Avg Negotiation Margin"
          value={`${metrics.averageNegotiationMarginPercent}%`}
          subtitle={`${formatCurrency(metrics.totalNegotiationMargin)} total margin`}
          colorClass="bg-teal-500"
        />
        <MetricCard
          title="Carrier Acceptance Rate"
          value={`${metrics.carrierAcceptanceRate}%`}
          subtitle={`${metrics.totalLoadsAccepted} of ${metrics.totalLoadsOffered} offered`}
          colorClass="bg-purple-500"
        />
        <MetricCard
          title="Loads Accepted"
          value={metrics.totalLoadsAccepted.toLocaleString()}
          subtitle={`${metrics.totalLoadsOffered - metrics.totalLoadsAccepted} declined`}
          colorClass="bg-yellow-500"
        />
      </div>

      {/* Revenue and Negotiation Margin Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Time Series Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={metrics.revenueTimeSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                formatter={(value: number, name: string) => {
                  if (name === 'Revenue') return [formatCurrency(value), name];
                  return [value, 'Loads Accepted'];
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3} 
                name="Revenue"
                dot={{ r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="loadsAccepted" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                name="Loads Accepted"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Negotiation Margin Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Negotiation Margin Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={metrics.negotiationMarginTimeSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                formatter={(value: number, name: string) => {
                  if (name === 'Avg Margin %') return [`${value}%`, name];
                  return [formatCurrency(value), 'Total Margin'];
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="averageMarginPercent" 
                stroke="#14b8a6" 
                strokeWidth={3} 
                name="Avg Margin %"
                dot={{ r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="totalMargin" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                name="Total Margin"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Carriers by Revenue */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Carriers by Revenue</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carrier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MC Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loads Accepted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.topCarriersByRevenue.map((carrier, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{carrier.carrier}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {carrier.mcNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {carrier.loadsAccepted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatCurrency(carrier.totalRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatCurrency(carrier.averageRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acceptance by Load Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Acceptance Rate by Commodity Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.acceptanceByLoadType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="commodityType" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              <Bar dataKey="acceptanceRate" fill="#8b5cf6" name="Acceptance Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Load Acceptance Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Commodity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Offered
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Accepted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.acceptanceByLoadType.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.commodityType}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.offered}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.accepted}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`font-semibold ${
                        item.acceptanceRate >= 75 ? 'text-green-600' : 
                        item.acceptanceRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {item.acceptanceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Revenue Summary by Commodity */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Commodity Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {metrics.acceptanceByLoadType.map((item, index) => (
            <div key={index} className="text-center">
              <p className="text-sm text-gray-600 mb-1">{item.commodityType}</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(item.totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">{item.accepted} loads</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

