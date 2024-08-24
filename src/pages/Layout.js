import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Routes, Route, Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Adjust the import path as needed
import ApplicationReview from './ApplicationReview';
import PrivacyPolicy from './PrivacyPolicy';
import AIUsagePolicy from './AIUsagePolicy';
import NegotiationSimulator from './NegotiationSimulator';
import SocietyCodeInput from './SocietyCodeInput'; // Make sure this import is correct
import DueDiligence from './DueDiligence'; // New import for Due Diligence
import './Layout.css';
import Videos from './Videos';
import './Authentication.css'; // Import the Authentication CSS
import SpeakToFounders from './SpeakToFounders';

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
          <button onClick={onClose} className="auth-button" style={{ marginTop: '10px', backgroundColor: '#888' }}>Close</button>
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
          <button onClick={onClose} className="auth-button" style={{ marginTop: '10px', backgroundColor: '#888' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
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

        // Subscribe to changes in the user's credits
        supabase
          .channel('public:profiles')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, payload => {
            console.log('Change received!', payload);
            const updatedCredits = payload.new.credits;
            setUserCredits(updatedCredits);
          })
          .subscribe();
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setShowOverlay(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setShowOverlay(false);
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
              <li className={location.pathname === "/due-diligence" ? "active" : ""}>
                <Link to="/due-diligence">Due Diligence Tool</Link>
              </li>
              <li className={location.pathname === "/negotiation-simulator" ? "active" : ""}>
                <Link to="/negotiation-simulator">Negotiation Simulator</Link>
              </li>
              <li className="section-title">Guide</li>
              <div className='seperator'></div>
              <li className={location.pathname === "/videos" ? "active" : ""}>
                <Link to="/videos">Videos</Link>
              </li>
              <li className={location.pathname === "/speak-to-founders" ? "active" : ""}>
                <Link to="/speak-to-founders">Speak to the Founders</Link>
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
            <Route path="/" element={<ApplicationReview />} />
            <Route path="/negotiation-simulator" element={<NegotiationSimulator />} />
            <Route path="/due-diligence" element={<DueDiligence />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/speak-to-founders" element={<SpeakToFounders />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/ai-usage-policy" element={<AIUsagePolicy />} />
          </Routes>
        </div>
      </div>
      {showOverlay && (
        <div className="menu-overlay" onClick={closeMenu}></div>
      )}
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