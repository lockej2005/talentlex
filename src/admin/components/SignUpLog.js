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
    // Convert time to San Francisco timezone (America/Los_Angeles)
    return DateTime.fromISO(dateTime)
      .setZone('America/Los_Angeles')
      .toLocaleString(DateTime.DATETIME_MED);
  };

  return (
    <div className="signup-log">
      <h3 className="h3-log">Recent User Activity</h3>
      <ul className="activity-list-log">
        {recentActivity.map((user) => (
          <li key={user.id} className="activity-item-log">
            <div className="user-info-log">
              <div className="user-name-log">{user.name || 'No Name'}</div>
              <div className="user-email-log">{user.email}</div>
            </div>
            <div className="activity-time-log">
              {user.last_active ? formatDateTime(user.last_active) : 'Unknown'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SignUpLog;
