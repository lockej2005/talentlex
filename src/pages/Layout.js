import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Comparison from './Comparison';
import './Layout.css';

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="layout">
      <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="logo">TalentLex</div>
        <nav>
          <ul>
            <li className="section-title">Tools</li>
            <li className="active">Application Review</li>
            <li>Scrape Account</li>
            <li>Review Arena</li>
            <li className="section-title">Resources</li>
            <div className='seperator'></div>
            <li>Club Resources</li>
            <li>The Corporate Law</li>
            <li>Forum</li>
            <li className="section-title">Other</li>
            <li>Privacy Policy</li>
            <li>AI Data Usage</li>
          </ul>
        </nav>
        <div className="user-info">
          <div>Joshua Locke</div>
          <div className="user-type">UQ Law Society Member</div>
          <div className="credits">500 credits</div>
          <button className="get-more-btn">Get More</button>
        </div>
      </div>
      <div className="main-content">
        <button className="menu-toggle" onClick={toggleMenu}>
          <Menu size={24} />
        </button>
        <div className="content-area">
          <Comparison />
        </div>
      </div>
    </div>
  );
};

export default Layout;