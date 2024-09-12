import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import QueryPage from './data-science/QueryPage';
import UserSearch from './data-science/UserSearch';
import UserLeaderboard from './UserLeaderboard';
import './Admin.css';
import { DateTime } from 'luxon';

const Admin = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [signupData, setSignupData] = useState({});
  const [todaySignups, setTodaySignups] = useState(0);
  const [activityData, setActivityData] = useState({});
  const [todayApplications, setTodayApplications] = useState(0);
  const [todayDraftGenerations, setTodayDraftGenerations] = useState(0);
  const [firmPopularityData, setFirmPopularityData] = useState([]);
  const [timeRange, setTimeRange] = useState('total');
  const location = useLocation();

  useEffect(() => {
    fetchSignupData();
    fetchActivityData();
    fetchFirmPopularityData();
  }, [timeRange]);

  const getDateString = (date) => {
    return DateTime.fromJSDate(date).setZone('America/Los_Angeles').toISODate();
  };

  const fetchSignupData = async () => {
    const now = DateTime.now().setZone('America/Los_Angeles');
    const endDate = now.endOf('day');
    const startDate = endDate.minus({ days: 365 });

    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate.toISO())
      .lte('created_at', endDate.toISO());

    if (error) {
      console.error('Error fetching signup data:', error);
      return;
    }

    const signupsByDate = {};
    let todayCount = 0;
    const todayPDT = now.toISODate();

    // Initialize signupsByDate with all dates in the range
    for (let d = startDate; d <= endDate; d = d.plus({ days: 1 })) {
      signupsByDate[d.toISODate()] = 0;
    }

    // Count signups for each day
    data.forEach(item => {
      const pdtDate = DateTime.fromISO(item.created_at).setZone('America/Los_Angeles').toISODate();
      
      if (signupsByDate[pdtDate] !== undefined) {
        signupsByDate[pdtDate]++;
      }
      
      if (pdtDate === todayPDT) {
        todayCount++;
      }
    });

    setSignupData(signupsByDate);
    setTodaySignups(todayCount);
  };

  const fetchActivityData = async () => {
    const now = DateTime.now().setZone('America/Los_Angeles');
    const endDate = now.endOf('day');
    const startDate = endDate.minus({ days: 365 });

    const { data: applicationData, error: applicationError } = await supabase
      .from('applications')
      .select('timestamp')
      .gte('timestamp', startDate.toISO())
      .lte('timestamp', endDate.toISO());

    const { data: draftGenerationData, error: draftGenerationError } = await supabase
      .from('draft_generations')
      .select('created_at')
      .gte('created_at', startDate.toISO())
      .lte('created_at', endDate.toISO());

    if (applicationError || draftGenerationError) {
      console.error('Error fetching activity data:', applicationError || draftGenerationError);
      return;
    }

    const activityByDate = {};
    let todayApplicationCount = 0;
    let todayDraftGenerationCount = 0;
    const todayPDT = now.toISODate();

    // Initialize activityByDate with all dates in the range
    for (let d = startDate; d <= endDate; d = d.plus({ days: 1 })) {
      activityByDate[d.toISODate()] = { applications: 0, draftGenerations: 0 };
    }

    // Count applications for each day
    applicationData.forEach(item => {
      const pdtDate = DateTime.fromISO(item.timestamp).setZone('America/Los_Angeles').toISODate();
      
      if (activityByDate[pdtDate] !== undefined) {
        activityByDate[pdtDate].applications++;
      }
      
      if (pdtDate === todayPDT) {
        todayApplicationCount++;
      }
    });

    // Count draft generations for each day
    draftGenerationData.forEach(item => {
      const pdtDate = DateTime.fromISO(item.created_at).setZone('America/Los_Angeles').toISODate();
      
      if (activityByDate[pdtDate] !== undefined) {
        activityByDate[pdtDate].draftGenerations++;
      }
      
      if (pdtDate === todayPDT) {
        todayDraftGenerationCount++;
      }
    });

    setActivityData(activityByDate);
    setTodayApplications(todayApplicationCount);
    setTodayDraftGenerations(todayDraftGenerationCount);
  };

  const fetchFirmPopularityData = async () => {
    const now = DateTime.now().setZone('America/Los_Angeles');
    const endDate = now.endOf('day');
    let startDate;

    switch (timeRange) {
      case 'today':
        startDate = now.startOf('day');
        break;
      case 'week':
        startDate = now.minus({ weeks: 1 }).startOf('day');
        break;
      case 'month':
        startDate = now.minus({ months: 1 }).startOf('day');
        break;
      case 'total':
      default:
        startDate = null;
        break;
    }

    const draftQuery = supabase
      .from('draft_generations')
      .select('firm')
      .not('firm', 'is', null);

    const applicationsQuery = supabase
      .from('applications')
      .select('firm')
      .not('firm', 'is', null);

    if (startDate) {
      draftQuery.gte('created_at', startDate.toISO());
      applicationsQuery.gte('timestamp', startDate.toISO());
    }

    draftQuery.lte('created_at', endDate.toISO());
    applicationsQuery.lte('timestamp', endDate.toISO());

    const [{ data: draftData, error: draftError }, { data: applicationsData, error: applicationsError }] = await Promise.all([
      draftQuery,
      applicationsQuery
    ]);

    if (draftError || applicationsError) {
      console.error('Error fetching firm popularity data:', draftError || applicationsError);
      return;
    }

    const firmCounts = {};
    [...draftData, ...applicationsData].forEach(item => {
      firmCounts[item.firm] = (firmCounts[item.firm] || 0) + 1;
    });

    const sortedData = Object.entries(firmCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([firm, count]) => ({ firm, count }));

    setFirmPopularityData(sortedData);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setShowOverlay(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setShowOverlay(false);
  };

  const renderContributionHistory = (data, title, todayCount, isActivity = false) => {
    if (!data || Object.keys(data).length === 0) return null;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const now = DateTime.now().setZone('America/Los_Angeles');
    const startOfYear = now.startOf('year');
    const endOfYear = now.endOf('year');

    // Adjust startDate to the first day of the year
    const startDate = startOfYear;

    const weeks = [];
    let currentWeek = [];

    // Fill in empty days at the start if the year doesn't begin on a Sunday
    const firstDayOfWeek = startDate.weekday % 7;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: null, count: 0 });
    }

    for (let d = startDate; d <= endOfYear; d = d.plus({ days: 1 })) {
      const dateString = d.toISODate();
      currentWeek.push({
        date: d,
        count: isActivity ? 
               (data[dateString] ? data[dateString].applications + data[dateString].draftGenerations : 0) :
               (data[dateString] || 0),
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill in empty days at the end if the year doesn't end on a Saturday
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
      <div className="contribution-history-admin">
        <h3>{title}</h3>
        <div className="contribution-graph-admin">
          <div className="graph-labels-admin">
            {days.map(day => <div key={day} className="day-label-admin">{day}</div>)}
          </div>
          <div className="graph-body-admin">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="graph-week-admin">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`contribution-day-admin ${day.date ? `level-${getContributionLevel(day.count)}` : 'empty'}-admin`}
                    data-tooltip={day.date ? `${day.count} ${day.count === 1 ? 'item' : 'items'} on ${formatDate(day.date)}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="month-labels-admin">
          {months.map(month => <div key={month} className="month-label-admin">{month}</div>)}
        </div>
        <div className="contribution-summary-admin">
          <span>Less</span>
          <ul className="contribution-scale-admin">
            <li className="level-0-admin" />
            <li className="level-1-admin" />
            <li className="level-2-admin" />
            <li className="level-3-admin" />
            <li className="level-4-admin" />
          </ul>
          <span>More</span>
        </div>
        <p className="today-signups-admin">{todayCount}</p>
      </div>
    );
  };

  const renderFirmPopularityTracker = () => {
    return (
      <div className="firm-popularity-tracker-admin">
        <h3>Firm Popularity Tracker</h3>
        <div className="time-range-selector-admin">
          <button onClick={() => setTimeRange('today')} className={timeRange === 'today' ? 'active-admin' : ''}>Today</button>
          <button onClick={() => setTimeRange('week')} className={timeRange === 'week' ? 'active-admin' : ''}>This Week</button>
          <button onClick={() => setTimeRange('month')} className={timeRange === 'month' ? 'active-admin' : ''}>This Month</button>
          <button onClick={() => setTimeRange('total')} className={timeRange === 'total' ? 'active-admin' : ''}>Total</button>
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

  return (
    <div className="layout-admin">
      <div className={`sidebar-admin ${menuOpen ? 'open-admin' : ''}`}>
        <div className="sidebar-content-admin">
          <div className="logo-admin">TalentLex Admin</div>
          <nav className="nav-admin">
            <ul className="nav-list-admin">
              <li className="section-title-admin">Admin Tools</li>
              <div className='separator-admin'></div>
              <li className={`nav-item-admin ${location.pathname === '/talentlex-admin' ? 'active-admin' : ''}`}>
                <Link to="/talentlex-admin">Home</Link>
              </li>
              <li className={`nav-item-admin ${location.pathname === '/talentlex-admin/query' ? 'active-admin' : ''}`}>
                <Link to="/talentlex-admin/query">Query Page</Link>
              </li>
              <li className={`nav-item-admin ${location.pathname === '/talentlex-admin/users' ? 'active-admin' : ''}`}>
                <Link to="/talentlex-admin/users">User Search</Link>
              </li>
              <li className={`nav-item-admin ${location.pathname === '/talentlex-admin/leaderboard' ? 'active-admin' : ''}`}>
                <Link to="/talentlex-admin/leaderboard">User Leaderboard</Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="user-info-admin">
          <div className='user-name-admin'>Admin User</div>
          <button className="logout-btn-admin">Log Out</button>
        </div>
      </div>
      <div className="main-content-admin">
        <button className="menu-toggle-admin" onClick={toggleMenu}>
          <Menu size={24} />
        </button>
        <div className="content-area-admin">
          <Routes>
            <Route path="/" element={
              <>
                <h1 className="page-title-admin">Admin Dashboard</h1>
                <p className="welcome-text-admin">Welcome to the TalentLex Admin Dashboard. Use the Query Page to access and analyze data, the User Search to find and view user profiles, or check the User Leaderboard to see top contributors.</p>
                {renderContributionHistory(signupData, "Sign Ups", `${todaySignups} signups today so far`)}
                {renderContributionHistory(activityData, "Applications and Draft Generations", `${todayApplications + todayDraftGenerations} total items today (${todayApplications} applications, ${todayDraftGenerations} draft generations)`, true)}
                {renderFirmPopularityTracker()}
              </>
            } />
            <Route path="/query" element={<QueryPage />} />
            <Route path="/users" element={<UserSearch />} />
            <Route path="/leaderboard" element={<UserLeaderboard />} />
          </Routes>
        </div>
      </div>
      {showOverlay && (
        <div className="menu-overlay-admin" onClick={closeMenu}></div>
      )}
    </div>
  );
};

export default Admin;