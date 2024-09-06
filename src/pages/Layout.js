import React, { useState, useEffect } from 'react';
import { Menu, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Routes, Route, Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ApplicationReview from './ApplicationReview';
import GenerateDraft from './GenerateDraft';
import PrivacyPolicy from './PrivacyPolicy';
import AIUsagePolicy from './AIUsagePolicy';
import NegotiationSimulator from './NegotiationSimulator';
import SocietyCodeInput from './SocietyCodeInput';
import DueDiligence from './DueDiligence';
import './Layout.css';
import Videos from './Videos';
import './Authentication2.css';
import SpeakToFounders from './SpeakToFounders';
import { UserInputProvider } from '../context/UserInputContext';
import FirmSelector from './FirmSelector';
import Profile from './Profile';

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

const HowDidYouHearPopup = ({ onClose, onSubmit }) => {
  const [selectedOption, setSelectedOption] = useState('');
  const [otherText, setOtherText] = useState('');

  const handleSubmit = () => {
    if (selectedOption && (selectedOption !== 'Other' || otherText.length >= 3)) {
      onSubmit(selectedOption === 'Other' ? otherText : selectedOption);
      onClose();
    }
  };

  return (
    <div className="frosted-glass-popup">
      <div className="popup-content">
        <h2>How did you hear about us?</h2>
        <div className="options-container">
          {['Word of Mouth', 'LinkedIn', 'Affiliated Society', 'Other'].map((option) => (
            <div key={option} className={`option ${selectedOption === option ? 'selected' : ''}`}>
              <input
                type="radio"
                id={option}
                name="hearAboutUs"
                value={option}
                checked={selectedOption === option}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              <label htmlFor={option}>{option}</label>
            </div>
          ))}
          {selectedOption === 'Other' && (
            <input
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Please specify (min 3 characters)"
              className="other-input"
            />
          )}
        </div>
        <button 
          onClick={handleSubmit} 
          className="submit-button" 
          disabled={!selectedOption || (selectedOption === 'Other' && otherText.length < 3)}
        >
          Done
        </button>
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
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [savedApplications, setSavedApplications] = useState([]);
  const [generateDraftExpanded, setGenerateDraftExpanded] = useState(false);
  const [applicationReviewExpanded, setApplicationReviewExpanded] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [selectedApplicationFirm, setSelectedApplicationFirm] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showHowDidYouHearPopup, setShowHowDidYouHearPopup] = useState(false);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, society, credits, reference')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else if (profileData) {
        setUserName(profileData.name || 'User');
        setUserCredits(profileData.credits || 0);

        if (profileData.reference === null) {
          setShowHowDidYouHearPopup(true);
        }

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

  const fetchSavedDrafts = async (userId) => {
    const { data: allDrafts, error } = await supabase
      .from('saved_drafts')
      .select('id, title, firm, question')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching saved drafts:', error);
      return;
    }

    setSavedDrafts(allDrafts);
  };

  const fetchSavedApplications = async (userEmail) => {
    const { data: allApplications, error } = await supabase
      .from('applications_vector')
      .select('firm, timestamp')
      .eq('email', userEmail)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching saved applications:', error.message);
      return;
    }

    setSavedApplications(allApplications);
  };

  useEffect(() => {
    fetchUserProfile();

    let profileSubscription;
    let draftsSubscription;
    let applicationsSubscription;

    const setupSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        profileSubscription = supabase
          .channel('public:profiles')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, payload => {
            const updatedCredits = payload.new.credits;
            setUserCredits(updatedCredits);
          })
          .subscribe();

        draftsSubscription = supabase
          .channel('public:saved_drafts')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'saved_drafts', 
              filter: `user_id=eq.${user.id}`
            }, 
            () => {
              fetchSavedDrafts(user.id);
            }
          )
          .subscribe();

        applicationsSubscription = supabase
          .channel('public:applications_vector')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'applications_vector', 
              filter: `email=eq.${user.email}`
            }, 
            () => {
              fetchSavedApplications(user.email);
            }
          )
          .subscribe();

        fetchSavedDrafts(user.id);
        fetchSavedApplications(user.email);
      }
    };

    setupSubscriptions();

    return () => {
      if (profileSubscription) profileSubscription.unsubscribe();
      if (draftsSubscription) draftsSubscription.unsubscribe();
      if (applicationsSubscription) applicationsSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath.startsWith('/generate-draft/')) {
      const draftId = currentPath.split('/generate-draft/')[1];
      setSelectedDraftId(draftId);
    } else if (currentPath === '/generate-draft') {
      setSelectedDraftId('new');
    } else if (currentPath.startsWith('/application-review/')) {
      const firm = currentPath.split('/application-review/')[1];
      setSelectedApplicationFirm(firm);
    } else if (currentPath === '/application-review') {
      setSelectedApplicationFirm('new');
    }
  }, [location]);

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

  const handleSelectDraft = (draftId) => {
    setSelectedDraftId(draftId);
    navigate(draftId === 'new' ? `/generate-draft` : `/generate-draft/${draftId}`);
  };

  const handleDeleteDraft = async (draftId) => {
    const { error } = await supabase
      .from('saved_drafts')
      .delete()
      .eq('id', draftId);

    if (error) {
      console.error('Error deleting draft:', error);
    } else {
      fetchSavedDrafts(user.id);
    }
  };

  const handleSelectApplication = (firm) => {
    setSelectedApplicationFirm(firm);
    navigate(firm === 'new' ? `/application-review` : `/application-review/${firm}`);
  };

  const handleDeleteApplication = async (firm) => {
    const { error } = await supabase
      .from('applications_vector')
      .delete()
      .eq('email', user.email)
      .eq('firm', firm);

    if (error) {
      console.error('Error deleting application:', error.message);
    } else {
      fetchSavedApplications(user.email);
    }
  };

  const renderSavedDrafts = () => {
    return (
      <>
        {savedDrafts.map(draft => (
          <li
            key={draft.id}
            className={`saved-draft ${selectedDraftId === draft.id ? 'active' : ''}`}
          >
            <Link to={`/generate-draft/${draft.id}`} onClick={() => handleSelectDraft(draft.id)}>{draft.title}</Link>
            <button className="delete-draft-btn" onClick={() => handleDeleteDraft(draft.id)}>
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        <li
          className={`saved-draft ${selectedDraftId === 'new' ? 'active' : ''}`}
          onClick={() => navigate('/firm-selector?mode=draft')}
        >
          <span className='add-new'>Add New +</span>
        </li>
      </>
    );
  };

  const renderSavedApplications = () => {
    return (
      <>
        {savedApplications.map(application => (
          <li
            key={application.firm}
            className={`saved-draft ${selectedApplicationFirm === application.firm ? 'active' : ''}`}
          >
            <Link to={`/application-review/${application.firm}`} onClick={() => handleSelectApplication(application.firm)}>{application.firm}</Link>
            <button className="delete-draft-btn" onClick={() => handleDeleteApplication(application.firm)}>
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        <li
          className={`saved-draft ${selectedApplicationFirm === 'new' ? 'active' : ''}`}
          onClick={() => navigate('/firm-selector?mode=review')}
        >
          <span className='add-new'>Add New +</span>
        </li>
      </>
    );
  };

  const handleHowDidYouHearSubmit = async (response) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ reference: response })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user profile:', error);
      } else {
        setShowHowDidYouHearPopup(false);
      }
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
                <li className="section-title">Tools</li>
                <div className='seperator'></div>
                <li className={location.pathname.startsWith("/generate-draft") ? "active" : ""}>
                  <div className="dropdown-header" onClick={() => setGenerateDraftExpanded(!generateDraftExpanded)}>
                    <Link to="/generate-draft">Generate Draft</Link>
                    {generateDraftExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  {generateDraftExpanded && (
                    <ul className="dropdown-content">
                      {renderSavedDrafts()}
                    </ul>
                  )}
                </li>
                <li className={location.pathname.startsWith("/application-review") ? "active" : ""}>
                  <div className="dropdown-header" onClick={() => setApplicationReviewExpanded(!applicationReviewExpanded)}>
                    <Link to="/application-review">Application Review</Link>
                    {applicationReviewExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  {applicationReviewExpanded && (
                    <ul className="dropdown-content">
                      {renderSavedApplications()}
                    </ul>
                  )}
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
              <Route index element={<Profile />} />
              <Route path="application-review" element={<ApplicationReview />} />
              <Route path="application-review/:firm" element={<ApplicationReview />} />
              <Route path="generate-draft" element={<GenerateDraft />} />
              <Route path="generate-draft/:id" element={<GenerateDraft />} />
              <Route path="firm-selector" element={<FirmSelector />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="ai-usage-policy" element={<AIUsagePolicy />} />
              <Route path="negotiation-simulator" element={<NegotiationSimulator />} />
              <Route path="videos" element={<Videos />} />
              <Route path="speak-to-founders" element={<SpeakToFounders />} />
              <Route path="due-diligence" element={<DueDiligence />} />
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
        {showHowDidYouHearPopup && (
          <HowDidYouHearPopup
            onClose={() => setShowHowDidYouHearPopup(false)}
            onSubmit={handleHowDidYouHearSubmit}
          />
        )}
      </div>
    </UserInputProvider>
  );
};

export default Layout;