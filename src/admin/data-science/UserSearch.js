import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import './UserSearch.css';

const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [contributions, setContributions] = useState({});
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchTerm.length > 2) {
      fetchSuggestions();
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserContributions(selectedUser.email);
      fetchUserActivities(selectedUser.email);
    }
  }, [selectedUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchSuggestions = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(5);

    if (error) {
      console.error('Error fetching suggestions:', error);
    } else {
      setSuggestions(data);
    }
  };

  const fetchUserContributions = async (email) => {
    setIsLoading(true);
    
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 365);

    const [draftsResponse, applicationsResponse] = await Promise.all([
      supabase
        .from('draft_generations')
        .select('created_at')
        .eq('email', email)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      supabase
        .from('applications')
        .select('timestamp')
        .eq('email', email)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString()),
    ]);

    const draftsData = draftsResponse.data || [];
    const applicationsData = applicationsResponse.data || [];

    const allContributions = [
      ...draftsData.map(item => new Date(item.created_at)),
      ...applicationsData.map(item => new Date(item.timestamp)),
    ];

    const contributionsByDate = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      contributionsByDate[d.toISOString().split('T')[0]] = 0;
    }

    allContributions.forEach(date => {
      const dateString = date.toISOString().split('T')[0];
      if (contributionsByDate[dateString] !== undefined) {
        contributionsByDate[dateString]++;
      }
    });

    setContributions(contributionsByDate);
    setIsLoading(false);
  };

  const fetchUserActivities = async (email) => {
    setIsLoading(true);
    
    const [draftsResponse, applicationsResponse] = await Promise.all([
      supabase
        .from('draft_generations')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false }),
      supabase
        .from('applications')
        .select('*')
        .eq('email', email)
        .order('timestamp', { ascending: false }),
    ]);

    const draftsData = draftsResponse.data || [];
    const applicationsData = applicationsResponse.data || [];

    const allActivities = [
      ...draftsData.map(item => ({
        ...item,
        type: 'Draft',
        date: new Date(item.created_at),
      })),
      ...applicationsData.map(item => ({
        ...item,
        type: 'Application Review',
        date: new Date(item.timestamp),
      })),
    ];

    allActivities.sort((a, b) => b.date - a.date);
    setActivities(allActivities);
    setIsLoading(false);
  };

  const handleSelectUser = async (user) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user details:', error);
    } else {
      setSelectedUser(data);
      setShowDropdown(false);
      setSearchTerm(data.name);
    }
    setIsLoading(false);
  };

  const renderUserProfile = () => {
    if (!selectedUser) return null;

    return (
      <div className="user-profile">
        <h2>{selectedUser.name || 'N/A'}</h2>
        <p><strong>UUID:</strong> {selectedUser.id}</p>
        <p><strong>Email:</strong> {selectedUser.email}</p>
        <p><strong>Society:</strong> {selectedUser.society || 'N/A'}</p>
        <p><strong>Credits:</strong> {selectedUser.credits || 0}</p>
        <p><strong>Education:</strong> {selectedUser.education || 'N/A'}</p>
        <p><strong>Undergraduate University:</strong> {selectedUser.undergraduate_uni || 'N/A'}</p>
        <p><strong>Work Experience:</strong> {selectedUser.work_experience || 'N/A'}</p>
        <p><strong>Created At:</strong> {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}</p>
        <p><strong>Last Updated:</strong> {selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleString() : 'N/A'}</p>
      </div>
    );
  };

  const renderContributionHistory = () => {
    if (!contributions || Object.keys(contributions).length === 0) return <p>No activity found for this user.</p>;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const contributionDays = Object.keys(contributions).map(date => ({
      date: new Date(date),
      count: contributions[date],
    }));

    const firstDate = new Date(contributionDays[0].date);
    firstDate.setDate(firstDate.getDate() - firstDate.getDay() + 1); // Start from Monday

    const weeks = [];
    for (let i = 0; i < 53; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        const currentDate = new Date(firstDate);
        currentDate.setDate(currentDate.getDate() + i * 7 + j);
        const dateString = currentDate.toISOString().split('T')[0];
        week.push({
          date: currentDate,
          count: contributions[dateString] || 0,
        });
      }
      weeks.push(week);
    }

    const getContributionLevel = (count) => {
      if (count === 0) return 0;
      if (count < 5) return 1;
      if (count < 10) return 2;
      if (count < 15) return 3;
      return 4;
    };

    const formatDate = (date) => {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    };

    return (
      <div className="contribution-history">
        <h3>Activity History</h3>
        <div className="contribution-graph">
          <div className="graph-labels">
            {days.map(day => <div key={day} className="day-label">{day}</div>)}
          </div>
          <div className="graph-body">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="graph-week">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`contribution-day level-${getContributionLevel(day.count)}`}
                    data-tooltip={`${day.count} ${day.count === 1 ? 'entry' : 'entries'} on ${formatDate(day.date)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="month-labels">
          {months.map(month => <div key={month} className="month-label">{month}</div>)}
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
      </div>
    );
  };

  const renderActivityAccordion = () => {
    if (!activities || activities.length === 0) return <p>No activities found for this user.</p>;

    const truncate = (str, n) => {
      if (!str) return ''; // Return empty string if str is null or undefined
      return (str.length > n) ? str.substr(0, n-1) + '...' : str;
    };

    return (
      <div className="activity-accordion">
        <h3>User Activities</h3>
        {activities.map((activity, index) => (
          <details key={index} className="activity-item">
            <summary>
              <span className="activity-date">
                {activity.date.toLocaleString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                  hour12: true,
                  weekday: 'short',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
              </span>
              <span className="activity-type">{activity.type}</span>
            </summary>
            <div className="activity-details">
              {activity.type === 'Draft' ? (
                <>
                  <p><strong>Question:</strong> {truncate(activity.question, 100)}</p>
                  <p><strong>Key Reasons:</strong> {truncate(activity.key_reasons, 100)}</p>
                  <p><strong>Relevant Experience:</strong> {truncate(activity.relevant_experience, 100)}</p>
                  <p><strong>Relevant Interests:</strong> {truncate(activity.relevant_interests, 100)}</p>
                  <p><strong>Personal Info:</strong> {truncate(activity.personal_info, 100)}</p>
                  <p><strong>Generated Draft:</strong> {activity.generated_draft}</p>
                </>
              ) : (
                <>
                  <p><strong>Question:</strong> {activity.question}</p>
                  <p><strong>Feedback:</strong> {activity.feedback}</p>
                  <p><strong>Device:</strong> {activity.device || 'N/A'}</p>
                  <p><strong>Screen Size:</strong> {activity.screen_size || 'N/A'}</p>
                  <p><strong>Application Text:</strong> {activity.application_text}</p>
                </>
              )}
            </div>
          </details>
        ))}
      </div>
    );
  };

  return (
    <div className="user-search-admin">
      <h2>User Search</h2>
      <div className="search-container" ref={searchInputRef}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search by name or email"
          className="search-input"
        />
        {showDropdown && suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((user) => (
              <li key={user.id} onClick={() => handleSelectUser(user)}>
                {user.name} | {user.email}
              </li>
            ))}
          </ul>
        )}
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        selectedUser && (
          <div className="user-details">
            {renderUserProfile()}
            {renderContributionHistory()}
            {renderActivityAccordion()}
          </div>
        )
      )}
    </div>
  );
};

export default UserSearch;