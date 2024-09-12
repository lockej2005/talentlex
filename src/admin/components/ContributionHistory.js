// components/ContributionHistory.js

import React from 'react';
import { DateTime } from 'luxon';
import './ContributionHistory.css';

const ContributionHistory = ({ data, title, todayCount, isActivity = false }) => {
  if (!data || Object.keys(data).length === 0) return null;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const now = DateTime.now().setZone('America/Los_Angeles');
  const startOfYear = now.startOf('year');
  const endOfYear = now.endOf('year');

  const startDate = startOfYear;
  const weeks = [];
  let currentWeek = [];

  // Fill in empty days at the start
  const firstDayOfWeek = startDate.weekday % 7;
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: null, count: 0 });
  }

  for (let d = startDate; d <= endOfYear; d = d.plus({ days: 1 })) {
    const dateString = d.toISODate();
    currentWeek.push({
      date: d,
      count: isActivity
        ? data[dateString]
          ? data[dateString].applications + data[dateString].draftGenerations
          : 0
        : data[dateString] || 0,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill in empty days at the end
  while (currentWeek.length < 7) {
    currentWeek.push({ date: null, count: 0 });
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getContributionLevel = (count) => {
    if (count === 0) return 0;
    if (count < 10) return 1;
    if (count < 25) return 2;
    if (count < 50) return 3;
    return 4;
  };

  const formatDate = (date) => {
    return date ? date.toLocaleString(DateTime.DATE_FULL) : '';
  };

  return (
    <div className="contribution-history">
      <h3>{title}</h3>
      <div className="contribution-graph">
        <div className="graph-labels">
          {days.map((day) => (
            <div key={day} className="day-label">
              {day}
            </div>
          ))}
        </div>
        <div className="graph-body">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="graph-week">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`contribution-day ${
                    day.date ? `level-${getContributionLevel(day.count)}` : 'empty'
                  }`}
                  data-tooltip={
                    day.date
                      ? `${day.count} ${day.count === 1 ? 'item' : 'items'} on ${formatDate(
                          day.date
                        )}`
                      : ''
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="month-labels">
        {months.map((month) => (
          <div key={month} className="month-label">
            {month}
          </div>
        ))}
      </div>
      <div className="contribution-summary">
        <span>Less</span>
        <ul className="contribution-scale">
          <li className="level-0" />
          <li className="level-1" />
          <li className="level-2" />
          <li className="level-3" />
          <li className="level-4" />
        </ul>
        <span>More</span>
      </div>
      <p className="today-count">{todayCount}</p>
    </div>
  );
};

export default ContributionHistory;
