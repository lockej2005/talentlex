// admin/Admin.js

import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import QueryPage from './data-science/QueryPage';
import UserSearch from './data-science/UserSearch';
import UserLeaderboard from './UserLeaderboard';
import ContributionHistory from './components/ContributionHistory';
import FirmPopularityTracker from './components/FirmPopularityTracker';
import SignUpLog from './components/SignUpLog';
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
  }, []);

  useEffect(() => {
    fetchFirmPopularityData();
  }, [timeRange]);

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
    data.forEach((item) => {
      const pdtDate = DateTime.fromISO(item.created_at)
        .setZone('America/Los_Angeles')
        .toISODate();

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
    applicationData.forEach((item) => {
      const pdtDate = DateTime.fromISO(item.timestamp)
        .setZone('America/Los_Angeles')
        .toISODate();

      if (activityByDate[pdtDate] !== undefined) {
        activityByDate[pdtDate].applications++;
      }

      if (pdtDate === todayPDT) {
        todayApplicationCount++;
      }
    });

    // Count draft generations for each day
    draftGenerationData.forEach((item) => {
      const pdtDate = DateTime.fromISO(item.created_at)
        .setZone('America/Los_Angeles')
        .toISODate();

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

    const [
      { data: draftData, error: draftError },
      { data: applicationsData, error: applicationsError },
    ] = await Promise.all([draftQuery, applicationsQuery]);

    if (draftError || applicationsError) {
      console.error('Error fetching firm popularity data:', draftError || applicationsError);
      return;
    }

    const firmCounts = {};
    [...draftData, ...applicationsData].forEach((item) => {
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

  return (
    <div className="layout">
      <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="logo">TalentLex Admin</div>
          <nav className="nav">
            <ul className="nav-list">
              <li className="section-title">Admin Tools</li>
              <div className="separator"></div>
              <li className={`nav-item ${location.pathname === '/talentlex-admin' ? 'active' : ''}`}>
                <Link to="/talentlex-admin">Home</Link>
              </li>
              <li
                className={`nav-item ${
                  location.pathname === '/talentlex-admin/query' ? 'active' : ''
                }`}
              >
                <Link to="/talentlex-admin/query">Query Page</Link>
              </li>
              <li
                className={`nav-item ${
                  location.pathname === '/talentlex-admin/users' ? 'active' : ''
                }`}
              >
                <Link to="/talentlex-admin/users">User Search</Link>
              </li>
              <li
                className={`nav-item ${
                  location.pathname === '/talentlex-admin/leaderboard' ? 'active' : ''
                }`}
              >
                <Link to="/talentlex-admin/leaderboard">User Leaderboard</Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="user-info">
          <div className="user-name">Admin User</div>
          <button className="logout-btn">Log Out</button>
        </div>
      </div>
      <div className="main-content">
        <button className="menu-toggle" onClick={toggleMenu}>
          <Menu size={24} />
        </button>
        <div className="content-area">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <h1 className="page-title">Admin Dashboard</h1>
                  <p className="welcome-text">
                    Welcome to the TalentLex Admin Dashboard. Use the Query Page to access and analyze
                    data, the User Search to find and view user profiles, or check the User Leaderboard
                    to see top contributors.
                  </p>
                  <div className="dashboard-content">
                    {/* First Row */}
                    <div className="dashboard-row">
                      <div className="half-column">
                        <ContributionHistory
                          data={signupData}
                          title="Sign Ups"
                          todayCount={`${todaySignups} signups today so far`}
                        />
                      </div>
                      <div className="half-column">
                        <ContributionHistory
                          data={activityData}
                          title="Applications and Draft Generations"
                          todayCount={`${todayApplications + todayDraftGenerations} total items today (${todayApplications} applications, ${todayDraftGenerations} draft generations)`}
                          isActivity={true}
                        />
                      </div>
                    </div>
                    {/* Second Row */}
                    <div className="dashboard-row">
                      <div className="half-column">
                        <FirmPopularityTracker
                          firmPopularityData={firmPopularityData}
                          timeRange={timeRange}
                          setTimeRange={setTimeRange}
                        />
                      </div>
                      <div className="half-column">
                        <SignUpLog />
                      </div>
                    </div>
                  </div>
                </>
              }
            />
            <Route path="/query" element={<QueryPage />} />
            <Route path="/users" element={<UserSearch />} />
            <Route path="/leaderboard" element={<UserLeaderboard />} />
          </Routes>
        </div>
      </div>
      {showOverlay && <div className="menu-overlay" onClick={closeMenu}></div>}
    </div>
  );
};

export default Admin;
