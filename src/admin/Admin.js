import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import QueryPage from './data-science/QueryPage';
import UserSearch from './data-science/UserSearch';
import UserLeaderboard from './UserLeaderboard';
import './Admin.css';

const Admin = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setShowOverlay(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setShowOverlay(false);
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