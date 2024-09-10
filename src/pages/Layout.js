import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PrivacyPolicy from './PrivacyPolicy';
import AIUsagePolicy from './AIUsagePolicy';
import NegotiationSimulator from './NegotiationSimulator';
import Videos from './Videos';
import SpeakToFounders from './SpeakToFounders';
import { UserInputProvider } from '../context/UserInputContext';
import Profile from './Profile';
import FirmDashboard from './FirmDashboard';
import FirmSelector from './FirmSelector';
import { Menu } from 'lucide-react';
import './Layout.css';
import './Authentication2.css';

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [userName, setUserName] = useState('');
  const [societyName, setSocietyName] = useState('');
  const [userCredits, setUserCredits] = useState(0);
  const [selectedFirms, setSelectedFirms] = useState([]);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
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
          setSocietyName(profileData.society || '');
        }

        fetchSelectedFirms(user.id);
      }
    };

    fetchUserProfile();
  }, []);

  const fetchSelectedFirms = async (userId) => {
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
    } else {
      setSelectedFirms(data.map(item => item.firms));
    }
  };

  useEffect(() => {
    const profileSubscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user?.id}` }, payload => {
        const updatedCredits = payload.new.credits;
        setUserCredits(updatedCredits);
      })
      .subscribe();

    const firmUserSubscription = supabase
      .channel('public:firm_user_table')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'firm_user_table', filter: `user_id=eq.${user?.id}` }, () => {
        if (user) {
          fetchSelectedFirms(user.id);
        }
      })
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
      firmUserSubscription.unsubscribe();
    };
  }, [user]);

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

  const handleGetMoreCredits = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const { url } = await response.json();
      window.location = url; // Redirect to Stripe Checkout
    } catch (error) {
      console.error('Error redirecting to Stripe:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <UserInputProvider>
      <div className="layout">
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
                <li className="section-title">Firms</li>
                <div className='seperator'></div>
                {selectedFirms.map(firm => (
                  <li key={firm.id} className={location.pathname === `/firm/${firm.id}` ? "active" : ""}>
                    <Link to={`/firm/${firm.id}`}>{firm.name}</Link>
                  </li>
                ))}
                <li className="add-new" onClick={handleAddNewFirm}>
                  Add New +
                </li>
                <li className="section-title">Guide</li>
                <div className='seperator'></div>
                <li className={location.pathname === "/videos" ? "active" : ""}>
                  <Link to="/videos">Videos</Link>
                </li>
                <li className={location.pathname === "/speak-to-founders" ? "active" : ""}>
                  <Link to="/speak-to-founders">Speak to the Founders</Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="user-info">
            <div className="credits">{userCredits} credits</div>
            <button onClick={handleGetMoreCredits} className="get-credits-btn">Get more Credits</button>
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
            <Routes>
              <Route path="/" element={<Profile />} />
              <Route path="/firm/:id/*" element={<FirmDashboard key={location.pathname} />} />
              <Route path="/firm-selector" element={<FirmSelector />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/ai-usage-policy" element={<AIUsagePolicy />} />
              <Route path="/negotiation-simulator" element={<NegotiationSimulator />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/speak-to-founders" element={<SpeakToFounders />} />
            </Routes>
          </div>
        </div>
        {showOverlay && (
          <div className="menu-overlay" onClick={closeMenu}></div>
        )}
      </div>
    </UserInputProvider>
  );
};

export default Layout;