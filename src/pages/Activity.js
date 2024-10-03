import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Activity.css';

const Activity = ({ userId, selectedFirm, onFirmChange }) => {
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [openDate, setOpenDate] = useState(null);
  const [deadlineDate, setDeadlineDate] = useState(null);
  const [userSubmitDate, setUserSubmitDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [maxScore, setMaxScore] = useState(0);
  const [firms, setFirms] = useState([]);
  const [hoveredApp, setHoveredApp] = useState(null);

  useEffect(() => {
    fetchFirms();
  }, []);

  useEffect(() => {
    if (selectedFirm && userId) {
      fetchData();
    } else {
      // Set default dates if no firm is selected
      setOpenDate(new Date());
      setDeadlineDate(new Date(new Date().setMonth(new Date().getMonth() + 3)));
    }
  }, [selectedFirm, userId]);

  const fetchFirms = async () => {
    try {
      const { data, error } = await supabase
        .from('firms')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setFirms(data);
    } catch (error) {
      console.error('Error fetching firms:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchApplicationData(),
        fetchFirmDates(),
        fetchUserSubmitDate(),
        fetchUserList()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationData = async () => {
    try {
      const { data, error } = await supabase
        .from('firm_user_table')
        .select('id, user_id, weighted_score, submit_time, submission_status')
        .eq('firm_id', selectedFirm)
        .not('submit_time', 'is', null);

      if (error) throw error;

      const userIds = data.map(app => app.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const userMap = Object.fromEntries(profiles.map(profile => [profile.id, profile.name]));

      const processedData = processApplicationData(data, userMap);
      setApplications(processedData);
    } catch (error) {
      console.error('Error fetching application data:', error);
    }
  };

  const fetchUserList = async () => {
    try {
      const { data, error } = await supabase
        .from('firm_user_table')
        .select('user_id, submission_status')
        .eq('firm_id', selectedFirm);

      if (error) throw error;

      const userIds = data.map(item => item.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const userMap = Object.fromEntries(profiles.map(profile => [profile.id, profile.name]));

      const userList = data.map(item => ({
        id: item.user_id,
        name: userMap[item.user_id] || 'Unknown',
        status: item.submission_status
      }));

      setUsers(userList);
    } catch (error) {
      console.error('Error fetching user list:', error);
    }
  };

  const fetchFirmDates = async () => {
    try {
      const { data, error } = await supabase
        .from('firms')
        .select('open_date, deadline_date')
        .eq('id', selectedFirm)
        .single();

      if (error) throw error;

      setOpenDate(new Date(data.open_date));
      setDeadlineDate(new Date(data.deadline_date));
    } catch (error) {
      console.error('Error fetching firm dates:', error);
    }
  };

  const fetchUserSubmitDate = async () => {
    try {
      const { data, error } = await supabase
        .from('firm_user_table')
        .select('submit_time')
        .eq('firm_id', selectedFirm)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data && data.submit_time) {
        setUserSubmitDate(new Date(data.submit_time));
      }
    } catch (error) {
      console.error('Error fetching user submit date:', error);
    }
  };

  const processApplicationData = (data, userMap) => {
    let maxScore = 0;
    const processed = data.map(app => {
      const score = parseFloat(app.weighted_score) || 0;
      if (score > maxScore) maxScore = score;
      return {
        id: app.id,
        date: new Date(app.submit_time),
        status: app.submission_status,
        score: score,
        name: userMap[app.user_id] || 'Unknown'
      };
    });
    setMaxScore(maxScore);
    return processed;
  };

  const renderTimeline = () => {
    if (!openDate || !deadlineDate) return null;

    const timelineStart = new Date(openDate);
    timelineStart.setMonth(timelineStart.getMonth() - 1);
    const timelineEnd = new Date(deadlineDate);
    timelineEnd.setMonth(timelineEnd.getMonth() + 1);

    const totalDays = (timelineEnd - timelineStart) / (1000 * 60 * 60 * 24);
    const pixelsPerDay = 100 / totalDays;

    const getPositionPercentage = (date) => {
      const days = (date - timelineStart) / (1000 * 60 * 60 * 24);
      return days * pixelsPerDay;
    };

    const getScorePosition = (score) => {
      const normalizedScore = maxScore > 0 ? score / maxScore : 0;
      return 5 + (normalizedScore * 90);
    };

    const monthPositions = [];
    let currentDate = new Date(timelineStart);
    while (currentDate <= timelineEnd) {
      monthPositions.push({
        month: currentDate.toLocaleString('default', { month: 'short' }),
        position: getPositionPercentage(currentDate)
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return (
      <div className="timeline-container-skew">
        <div className="application-dots-skew">
          {applications.map((app, index) => {
            const left = getPositionPercentage(app.date);
            const bottom = getScorePosition(app.score);
            return (
              <div
                key={index}
                className={`application-dot-skew ${app.status.toLowerCase()}`}
                style={{
                  left: `${left}%`,
                  bottom: `${bottom}%`
                }}
                onMouseEnter={() => setHoveredApp(app)}
                onMouseLeave={() => setHoveredApp(null)}
              ></div>
            );
          })}
        </div>
        <div className="timeline-skew">
          <div className="timeline-line-skew"></div>
          <div className="timeline-events-skew">
            <div className="timeline-event-skew open" style={{left: `${getPositionPercentage(openDate)}%`}}>
              <div className="event-line-skew"></div>
              <div className="event-label-skew">Applications Opened</div>
            </div>
            <div className="timeline-event-skew deadline" style={{left: `${getPositionPercentage(deadlineDate)}%`}}>
              <div className="event-line-skew"></div>
              <div className="event-label-skew">Application Deadline</div>
            </div>
          </div>
          <div className="user-events-skew">
            <div className="timeline-event-skew current" style={{left: `${getPositionPercentage(new Date())}%`}}>
              <div className="event-line-skew"></div>
              <div className="event-label-skew">Today's Date</div>
            </div>
          </div>
          <div className="timeline-months-skew">
            {monthPositions.map(({ month, position }) => (
              <div key={month + position} className="month-label-skew" style={{left: `${position}%`}}>{month}</div>
            ))}
          </div>
        </div>
        {hoveredApp && (
          <div className="hover-info-skew" style={{
            left: `${getPositionPercentage(hoveredApp.date)}%`,
            bottom: `${getScorePosition(hoveredApp.score)}%`
          }}>
            <p><strong>Name:</strong> {hoveredApp.name}</p>
            <p><strong>Status:</strong> {hoveredApp.status}</p>
            <p><strong>Score:</strong> {hoveredApp.score.toFixed(2)}</p>
            <p><strong>Date:</strong> {hoveredApp.date.toLocaleDateString()}</p>
          </div>
        )}
      </div>
    );
  };

  const handleFirmChange = (event) => {
    const newFirmId = event.target.value;
    onFirmChange(newFirmId);
  };

  return (
    <div className="activity-container-skew">
      <div className="bg-wrapper">
        <div className="firm-selector-skew">
          <select value={selectedFirm} onChange={handleFirmChange}>
            <option value="">Select Firm</option>
            {firms.map((firm) => (
              <option key={firm.id} value={firm.id}>{firm.name}</option>
            ))}
          </select>
        </div>
        <div className="main-content-skew">
          <div className="user-list-panel-skew">
            <h3>Applicants</h3>
            <div className="user-list-skew">
              {users.length > 0 ? (
                users.map(user => (
                  <div key={user.id} className="user-item-skew">
                    <span>{user.name}</span>
                    <span className={`status-skew ${user.status.toLowerCase()}`}>{user.status}</span>
                  </div>
                ))
              ) : (
                <div className="user-item-skew">
                  <span>No applicants yet</span>
                </div>
              )}
            </div>
          </div>
          <div className="skew-graph-panel-skew">
            <h3>Application Activity</h3>
            {renderTimeline()}
          </div>
        </div>
        <div className="bottom-panel-skew">
          <div className="legend-skew">
            <div className="legend-item-skew">
              <span className="legend-color-skew accepted"></span>
              <span>Accepted</span>
            </div>
            <div className="legend-item-skew">
              <span className="legend-color-skew rejected"></span>
              <span>Rejected</span>
            </div>
            <div className="legend-item-skew">
              <span className="legend-color-skew pending"></span>
              <span>Pending</span>
            </div>
            <div className="legend-item-skew">
              <span className="legend-color-skew submitted"></span>
              <span>Submitted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Activity;