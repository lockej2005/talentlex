import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { firms, questions } from '../data/ApplicationReviewData';
import './FirmSelector.css';

const FirmSelector = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [existingDrafts, setExistingDrafts] = useState([]);
  const [existingApplications, setExistingApplications] = useState([]);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const mode = new URLSearchParams(location.search).get('mode') || 'review';

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        fetchExistingItems(user.email, user.id);
      }
    };
    getUserEmail();
  }, []);

  const fetchExistingItems = async (email, userId) => {
    const { data: drafts, error: draftsError } = await supabase
      .from('saved_drafts')
      .select('firm')
      .eq('user_id', userId);

    if (draftsError) {
      console.error('Error fetching existing drafts:', draftsError.message);
    } else {
      setExistingDrafts(drafts.map(draft => draft.firm));
    }

    const { data: applications, error: applicationsError } = await supabase
      .from('applications_vector')
      .select('firm')
      .eq('email', email);

    if (applicationsError) {
      console.error('Error fetching existing applications:', applicationsError.message);
    } else {
      setExistingApplications(applications.map(app => app.firm));
    }
  };

  const handleFirmSelect = async (firmName) => {
    setError('');

    const firmQuestions = questions[firmName] || [];
    const defaultQuestion = firmQuestions.length > 0 ? firmQuestions[0].value : "Default question";

    try {
      if (mode === 'draft') {
        const { data, error } = await supabase
          .from('saved_drafts')
          .insert([
            { 
              user_id: (await supabase.auth.getUser()).data.user.id,
              title: firmName,
              firm: firmName,
              question: defaultQuestion
            }
          ])
          .select();

        if (error) throw error;
        if (data) {
          navigate(`/generate-draft/${data[0].id}`);
        }
      } else {
        const { data, error } = await supabase
          .from('applications_vector')
          .insert([
            { 
              email: userEmail,
              firm: firmName,
              question: defaultQuestion,
              application_text: '',
              feedback: '',
              device: 'web',
              screen_size: `${window.innerWidth}x${window.innerHeight}`,
              timestamp: new Date().toISOString()
            }
          ])
          .select();

        if (error) throw error;
        if (data) {
          navigate(`/application-review/${firmName}`);
        }
      }
    } catch (error) {
      console.error(`Error creating ${mode}:`, error.message);
      setError(`Failed to create ${mode}. Please try again.`);
    }
  };

  const filteredFirms = firms.filter(firm =>
    firm.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="firm-selector-container">
      <h2>Select a Firm for {mode === 'draft' ? 'Draft' : 'Application Review'}</h2>
      <input
        type="text"
        placeholder="Search firms..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="firm-search-input"
      />
      {error && <div className="error-message">{error}</div>}
      <div className="firms-grid">
        {filteredFirms.map((firm, index) => {
          const isDisabled = mode === 'draft' 
            ? existingDrafts.includes(firm.label)
            : existingApplications.includes(firm.label);
          return (
            <div
              key={index}
              className={`firm-card ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && handleFirmSelect(firm.label)}
            >
              {firm.label}
              {isDisabled && <span className="existing-indicator">{mode === 'draft' ? ' Draft Exists' : ' Review Exists'}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FirmSelector;