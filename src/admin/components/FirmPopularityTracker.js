// components/FirmPopularityTracker.js

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './FirmPopularityTracker.css';

const FirmPopularityTracker = ({ firmPopularityData, timeRange, setTimeRange }) => {
  return (
    <div className="firm-popularity-tracker">
      <h3>Firm Popularity Tracker</h3>
      <div className="time-range-selector">
        <button
          onClick={() => setTimeRange('today')}
          className={timeRange === 'today' ? 'active' : ''}
        >
          Today
        </button>
        <button
          onClick={() => setTimeRange('week')}
          className={timeRange === 'week' ? 'active' : ''}
        >
          This Week
        </button>
        <button
          onClick={() => setTimeRange('month')}
          className={timeRange === 'month' ? 'active' : ''}
        >
          This Month
        </button>
        <button
          onClick={() => setTimeRange('total')}
          className={timeRange === 'total' ? 'active' : ''}
        >
          Total
        </button>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={firmPopularityData}>
          <XAxis dataKey="firm" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#276D8B" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FirmPopularityTracker;
