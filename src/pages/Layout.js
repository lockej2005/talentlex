import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Adjust the import path as needed
import Comparison from './Comparison';
import Scrape from './Scrape';
import PrivacyPolicy from './PrivacyPolicy';
import AIUsagePolicy from './AIUsagePolicy';
import ComparisonDashboard from './ComparisonDashboard'; // New import for Review Arena
import SocietyCodeInput from './SocietyCodeInput'; // Make sure this import is correct
import './Layout.css';
import './Authentication.css'; // Import the Authentication CSS

const PopupSocietyJoin = ({ onClose, onJoin }) => {
  const [societyCode, setSocietyCode] = useState('');

  const handleJoin = () => {
    onJoin(societyCode);
  };

  return (
    <div className="popup-overlay">
      <div className="auth-container">
        <div className="auth-form">
          <h2>Join a Society</h2>
          <p>Ask a member of your Society to give you the unique 6 Digit code to join</p>
          <SocietyCodeInput onChange={setSocietyCode} />
          <button onClick={handleJoin} className="auth-button">Join</button>
          <button onClick={onClose} className="auth-button" style={{marginTop: '10px', backgroundColor: '#888'}}>Close</button>
        </div>
      </div>
    </div>
  );
};

const PopupSocietyDetails = ({ society, onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="auth-container">
        <div className="auth-form">
          <h2>Society Details</h2>
          <p><strong>Name:</strong> {society.name}</p>
          <p><strong>Join Code:</strong> {society.code}</p>
          <p><strong>Owners Email:</strong> {society.email || 'N/A'}</p>
          <p><strong>Plan:</strong> {society.plan || 'N/A'}</p>
          <button onClick={onClose} className="auth-button" style={{marginTop: '10px', backgroundColor: '#888'}}>Close</button>
        </div>
      </div>
    </div>
  );
};

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [societyName, setSocietyName] = useState('');
  const [societyDetails, setSocietyDetails] = useState(null);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [showSocietyDetailsPopup, setShowSocietyDetailsPopup] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, society, credits')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else if (profileData) {
        setUserName(profileData.name || 'User');
        setUserCredits(profileData.credits || 0);
        
        if (profileData.society) {
          const { data: societyData, error: societyError } = await supabase
            .from('societies')
            .select('*')
            .eq('code', profileData.society)
            .single();

          if (societyError) {
            console.error('Error fetching society:', societyError);
          } else if (societyData) {
            setSocietyName(societyData.name);
            setSocietyDetails(societyData);
          }
        }
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  const handleJoinSociety = async (code) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ society: code })
        .eq('id', user.id);

      if (error) {
        console.error('Error joining society:', error);
      } else {
        fetchUserProfile();
        setShowJoinPopup(false);
      }
    }
  };

  return (
    <div className="layout">
      <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="logo">TalentLex</div>
          <nav>
            <ul>
              <li className="section-title">Tools</li>
              <div className='seperator'></div>
              <li className={location.pathname === "/" ? "active" : ""}>
                <Link to="/">Application Review</Link>
              </li>
              <li className={location.pathname === "/review-arena" ? "active" : ""}>
                <Link to="/review-arena">Negotiation Arena</Link>
              </li>
              <li className="section-title">Legal</li>
              <div className='seperator'></div>
              <li className={location.pathname === "/privacy-policy" ? "active" : ""}>
                <Link to="/privacy-policy">Privacy Policy</Link>
              </li>
              <li className={location.pathname === "/ai-usage-policy" ? "active" : ""}>
                <Link to="/ai-usage-policy">AI Data Usage</Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="user-info">
          <div className="credits">{userCredits} credits</div>
          <div className='seperator'></div>
          <div className='user-name'>{userName || 'Loading...'}</div>
          {societyName ? (
            <div className="society-name" onClick={() => setShowSocietyDetailsPopup(true)}>{societyName}</div>
          ) : (
            <div className="join-society" onClick={() => setShowJoinPopup(true)}>Join a society</div>
          )}
          <button onClick={handleLogout} className="logout-btn">Log Out</button>
        </div>
      </div>
      <div className="main-content">
        <button className="menu-toggle" onClick={toggleMenu}>
          <Menu size={24} />
        </button>
        <div className="content-area">
          <Routes>
            <Route path="/" element={<Comparison />} />
            <Route path="/scrape" element={<Scrape />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/ai-usage-policy" element={<AIUsagePolicy />} />
            <Route path="/review-arena" element={<ComparisonDashboard />} />
          </Routes>
        </div>
      </div>
      {showJoinPopup && (
        <PopupSocietyJoin 
          onClose={() => setShowJoinPopup(false)}
          onJoin={handleJoinSociety}
        />
      )}
      {showSocietyDetailsPopup && societyDetails && (
        <PopupSocietyDetails 
          society={societyDetails}
          onClose={() => setShowSocietyDetailsPopup(false)}
        />
      )}
    </div>
  );
};

export default Layout;