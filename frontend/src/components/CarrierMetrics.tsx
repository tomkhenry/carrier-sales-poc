/**
 * CarrierMetrics - Carrier validation metrics panel
 */

import React from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CarrierValidationMetrics } from '../types/metrics';
import { MetricCard } from './MetricCard';

interface CarrierMetricsProps {
  metrics: CarrierValidationMetrics;
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export const CarrierMetrics: React.FC<CarrierMetricsProps> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Carrier Validation Metrics</h2>
        <p className="text-gray-600">Monitor inbound carrier call performance and validation success rates</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Inbound Calls"
          value={metrics.totalCalls.toLocaleString()}
          subtitle="Last 30 days"
          colorClass="bg-blue-500"
        />
        <MetricCard
          title="Validation Success Rate"
          value={`${metrics.successRate}%`}
          subtitle={`${Math.round(metrics.totalCalls * metrics.successRate / 100)} successful`}
          colorClass="bg-green-500"
        />
        <MetricCard
          title="Avg Validation Time"
          value={`${(metrics.averageValidationTimeMs / 1000).toFixed(2)}s`}
          subtitle="Response time"
          colorClass="bg-purple-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Validation Trends (30 Days)</h3>
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
              <Line type="monotone" dataKey="successful" stroke="#10b981" strokeWidth={2} name="Successful" />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Failure Reasons Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Failure Reasons</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.failureReasons}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {metrics.failureReasons.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                formatter={(_value, entry: any) => entry.payload.reason}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Failure Reasons Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Failure Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Failure Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.failureReasons.map((reason, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reason.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {reason.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${reason.percentage}%` }}
                        />
                      </div>
                      <span>{reason.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

