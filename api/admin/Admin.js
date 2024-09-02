import React, { useState } from 'react';
import { Menu, ChevronDown, ChevronRight } from 'lucide-react';
import './Admin.css';

const Admin = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

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
              <li className="nav-item-admin">
                <div className="dropdown-header-admin">
                  <span>Data Science</span>
                  <ChevronRight size={16} />
                </div>
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
          <h1 className="page-title-admin">Admin Dashboard</h1>
          <p className="welcome-text-admin">Welcome to the TalentLex Admin Dashboard. Select a tool from the sidebar to get started.</p>
        </div>
      </div>
      {showOverlay && (
        <div className="menu-overlay-admin" onClick={closeMenu}></div>
      )}
    </div>
  );
};

export default Admin;