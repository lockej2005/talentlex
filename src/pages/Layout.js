import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PrivacyPolicy from './PrivacyPolicy';
import AIUsagePolicy from './AIUsagePolicy';
import NegotiationSimulator from './NegotiationSimulator';
import { UserInputProvider } from '../context/UserInputContext';
import Profile from './Profile';
import FirmDashboard from './FirmDashboard';
import FirmSelector from './FirmSelector';
import Plans from './Plans';
import Success from './Success';
import ManageSubscription from './ManageSubscription';
import Activity from './Activity';
import { Menu } from 'lucide-react';
import './Layout.css';
import './Authentication2.css';
import HowDidYouHearSurvey from './HowDidYouHearSurvey';

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [userName, setUserName] = useState('');
  const [societyName, setSocietyName] = useState('');
  const [userCredits, setUserCredits] = useState(0);
  const [hasPlus, setHasPlus] = useState(false);
  const [selectedFirms, setSelectedFirms] = useState([]);
  const [user, setUser] = useState(null);
  const [showPlans, setShowPlans] = useState(false);
  const [showManageSubscription, setShowManageSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [selectedFirm, setSelectedFirm] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('name, society, credits, hasPlus')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Error fetching user profile:', profileError);
            setSubscriptionError('Failed to fetch user profile. Please try refreshing the page.');
          } else if (profileData) {
            setUserName(profileData.name || 'User');
            setUserCredits(profileData.credits || 0);
            setSocietyName(profileData.society || '');
            setHasPlus(profileData.hasPlus || false);
          }

          await fetchSelectedFirms(user.id);
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        setSubscriptionError('An error occurred while loading user data. Please try again later.');
      }
    };

    fetchUserProfile();
  }, []);

  const fetchSelectedFirms = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('firm_user_table')
        .select(`
          firm_id,
          firms (
            id,
            name
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching selected firms:', error);
        setSubscriptionError('Failed to fetch selected firms. Please try refreshing the page.');
      } else {
        setSelectedFirms(data.map(item => item.firms));
        if (data.length > 0 && !selectedFirm) {
          setSelectedFirm(data[0].firms.id);
        }
      }
    } catch (error) {
      console.error('Error in fetchSelectedFirms:', error);
      setSubscriptionError('An error occurred while loading firm data. Please try again later.');
    }
  };

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

  const handleAddNewFirm = () => {
    navigate('/firm-selector');
  };

  const handleGetMoreCredits = () => {
    if (hasPlus) {
      setShowManageSubscription(true);
    } else {
      setShowPlans(true);
    }
  };

  const handleClosePlans = () => {
    setShowPlans(false);
  };

  const handleCloseManageSubscription = () => {
    setShowManageSubscription(false);
  };

  const handleFirmChange = (firmId) => {
    setSelectedFirm(firmId);
  };

  return (
    <UserInputProvider>
      <div className="layout">
        <HowDidYouHearSurvey />
        <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <div className="sidebar-content">
            <div className="logo">TalentLex</div>
            <nav>
              <ul>
                <li className="section-title">Personalization</li>
                <div className='seperator'></div>
                <li className={location.pathname === "/" ? "active" : ""}>
                  <Link to="/">Profile</Link>
                </li>
                <li className={location.pathname === "/activity" ? "active" : ""}>
                  <Link to="/activity">
                    <div className='label-row'>
                      Activity
                      <span className="new-tag">New !</span>
                    </div>
                  </Link>
                </li>
                <li className="section-title">Firms</li>
                <div className='seperator'></div>
                {selectedFirms.length > 0 ? (
                  <>
                    {selectedFirms.map(firm => (
                      <li key={firm.id} className={location.pathname === `/firm/${firm.id}` ? "active" : ""}>
                        <Link to={`/firm/${firm.id}`}>{firm.name}</Link>
                      </li>
                    ))}
                    <li className="add-new" onClick={handleAddNewFirm}>
                      Add New Firm +
                    </li>
                  </>
                ) : (
                  <>
                    <li className="no-firms-prompt">Get started by adding a firm ⬇️</li>
                    <li className="add-new" onClick={handleAddNewFirm}>
                      Add New Firm +
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </div>
          <div className="user-info">
            <div className="credits">{hasPlus ? 'UNLIMITED' : `${userCredits} credits`}</div>
            <button onClick={handleGetMoreCredits} className="get-credits-btn">
              {hasPlus ? 'Manage Subscription' : 'Upgrade to Plus'}
            </button>
            <div className='seperator'></div>
            <div className='user-name'>{userName || 'Loading...'}</div>
            {societyName && <div className="society-name">{societyName}</div>}
            <button onClick={handleLogout} className="logout-btn">Log Out</button>
          </div>
        </div>
        <div className="main-content">
          <button className="menu-toggle" onClick={toggleMenu}>
            <Menu size={24} />
          </button>
          <div className="content-area">
            {subscriptionError && (
              <div className="error-banner">
                {subscriptionError}
              </div>
            )}
            <Routes>
              <Route path="/" element={<Profile />} />
              <Route path="/activity" element={<Activity userId={user?.id} selectedFirm={selectedFirm} onFirmChange={handleFirmChange} />} />
              <Route path="/firm/:id/*" element={<FirmDashboard key={location.pathname} />} />
              <Route path="/firm-selector" element={<FirmSelector />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/ai-usage-policy" element={<AIUsagePolicy />} />
              <Route path="/negotiation-simulator" element={<NegotiationSimulator />} />
              <Route path="/success" element={<Success />} />
            </Routes>
          </div>
        </div>
        {showPlans && (
          <div className="overlay-2">
            <Plans onClose={handleClosePlans} userId={user?.id} />
          </div>
        )}
        {showManageSubscription && (
          <div className="overlay">
            <ManageSubscription onClose={handleCloseManageSubscription} userId={user?.id} />
          </div>
        )}
        {showOverlay && (
          <div className="menu-overlay" onClick={closeMenu}></div>
        )}
      </div>
    </UserInputProvider>
  );
};

export default Layout;