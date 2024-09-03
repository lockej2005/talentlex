import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import QueryPage from './data-science/QueryPage';
import UserSearch from './data-science/UserSearch';
import UserLeaderboard from './UserLeaderboard';
import './Admin.css';

const Admin = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [signupData, setSignupData] = useState({});
  const [todaySignups, setTodaySignups] = useState(0);
  const [applicationData, setApplicationData] = useState({});
  const [todayApplications, setTodayApplications] = useState(0);
  const [todayDraftGenerations, setTodayDraftGenerations] = useState(0);
  const location = useLocation();

  useEffect(() => {
    fetchSignupData();
    fetchApplicationData();
  }, []);

  const getDateString = (date) => {
    return date.toISOString().split('T')[0];
  };

  const fetchSignupData = async () => {
    const now = new Date();
    const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - 365);

    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      console.error('Error fetching signup data:', error);
      return;
    }

    const signupsByDate = {};
    let todayCount = 0;
    const todayPDT = getDateString(new Date(now.getTime() - 7 * 60 * 60 * 1000));

    // Initialize signupsByDate with all dates in the range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const pdtDate = getDateString(new Date(d.getTime() - 7 * 60 * 60 * 1000));
      signupsByDate[pdtDate] = 0;
    }

    // Count signups for each day
    data.forEach(item => {
      const pdtDate = getDateString(new Date(new Date(item.created_at).getTime() - 7 * 60 * 60 * 1000));
      
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

  const fetchApplicationData = async () => {
    const now = new Date();
    const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - 365);

    const { data: applicationData, error: applicationError } = await supabase
      .from('applications')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: draftGenerationData, error: draftGenerationError } = await supabase
      .from('applications')
      .select('timestamp')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (applicationError || draftGenerationError) {
      console.error('Error fetching application data:', applicationError || draftGenerationError);
      return;
    }

    const applicationsByDate = {};
    let todayApplicationCount = 0;
    let todayDraftGenerationCount = 0;
    const todayPDT = getDateString(new Date(now.getTime() - 7 * 60 * 60 * 1000));

    // Initialize applicationsByDate with all dates in the range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const pdtDate = getDateString(new Date(d.getTime() - 7 * 60 * 60 * 1000));
      applicationsByDate[pdtDate] = { applications: 0, draftGenerations: 0 };
    }

    // Count applications for each day
    applicationData.forEach(item => {
      const pdtDate = getDateString(new Date(new Date(item.created_at).getTime() - 7 * 60 * 60 * 1000));
      
      if (applicationsByDate[pdtDate] !== undefined) {
        applicationsByDate[pdtDate].applications++;
      }
      
      if (pdtDate === todayPDT) {
        todayApplicationCount++;
      }
    });

    // Count draft generations for each day
    draftGenerationData.forEach(item => {
      const pdtDate = getDateString(new Date(new Date(item.timestamp).getTime() - 7 * 60 * 60 * 1000));
      
      if (applicationsByDate[pdtDate] !== undefined) {
        applicationsByDate[pdtDate].draftGenerations++;
      }
      
      if (pdtDate === todayPDT) {
        todayDraftGenerationCount++;
      }
    });

    setApplicationData(applicationsByDate);
    setTodayApplications(todayApplicationCount);
    setTodayDraftGenerations(todayDraftGenerationCount);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setShowOverlay(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setShowOverlay(false);
  };

  const renderContributionHistory = (data, title, todayCount, countType) => {
    if (!data || Object.keys(data).length === 0) return null;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const contributionDays = Object.keys(data).map(date => ({
      date: new Date(date + 1),
      count: countType ? data[date][countType] : data[date],
    }));

    // Sort contributionDays by date
    contributionDays.sort((a, b) => a.date - b.date);

    const lastDate = new Date(contributionDays[contributionDays.length - 1].date);
    const firstDate = new Date(lastDate);
    firstDate.setDate(firstDate.getDate() - 358); // 51 weeks + 1 day to ensure we have 52 weeks

    const weeks = [];
    for (let i = 0; i < 52; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        const currentDate = new Date(firstDate);
        currentDate.setDate(currentDate.getDate() + i * 7 + j);
        const dateString = getDateString(currentDate);
        week.push({
          date: currentDate,
          count: countType ? (data[dateString] ? data[dateString][countType] : 0) : (data[dateString] || 0),
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
      return date.toLocaleDateString("en-US", options);
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
                    className={`contribution-day-admin level-${getContributionLevel(day.count)}-admin`}
                    data-tooltip={`${day.count} ${day.count === 1 ? countType || 'item' : (countType + 's') || 'items'} on ${formatDate(day.date)}`}
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
        <p className="today-signups-admin">{todayCount} {countType || 'items'} today so far</p>
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
                {renderContributionHistory(signupData, "Sign Ups", todaySignups)}
                {renderContributionHistory(applicationData, "Applications and Draft Generations", `${todayApplications} applications, ${todayDraftGenerations} draft generations`, "applications")}
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