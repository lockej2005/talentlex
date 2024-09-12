// admin/components/SignUpLog.js

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './SignUpLog.css';
import { DateTime } from 'luxon';

const SignUpLog = () => {
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    // Fetch users ordered by last_active
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, last_active')
      .not('last_active', 'is', null)
      .order('last_active', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching recent activity:', error);
      return;
    }

    setRecentActivity(data);
  };

  const formatDateTime = (dateTime) => {
    return DateTime.fromISO(dateTime).toLocaleString(DateTime.DATETIME_MED);
  };

  return (
    <div className="signup-log">
      <h3>Recent User Activity</h3>
      <ul className="activity-list">
        {recentActivity.map((user) => (
          <li key={user.id} className="activity-item">
            <div className="user-info">
              <span className="user-name">{user.name || 'No Name'}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <div className="activity-time">
              {user.last_active ? formatDateTime(user.last_active) : 'Unknown'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SignUpLog;
