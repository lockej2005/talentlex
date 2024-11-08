import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import GenerateDraft from './GenerateDraft';
import ApplicationReview from './ApplicationReview';
import ScoreWarnings from './ScoreWarnings';
import WorkExperience from './WorkExperience';
import { firms } from '../data/ApplicationReviewData';
import './FirmDashboard.css';

const FirmDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [firmDetails, setFirmDetails] = useState(null);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [applicationData, setApplicationData] = useState(null);
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [workExperiences, setWorkExperiences] = useState([]);
  const [user, setUser] = useState(null);
  const [scores, setScores] = useState(null);
  const { id } = useParams();
  const workExperienceRef = useRef(null);
  const scoreDisplayRef = useRef(null);
  const [realtimeError, setRealtimeError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
          setUser(user);
        } else {
          setRealtimeError('User not found. Please log in.');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setRealtimeError('Failed to authenticate user. Please try logging in again.');
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    let scoreChannel;

    const setupRealtimeSubscription = async () => {
      if (user && id) {
        try {
          await fetchFirmDetails();
          await fetchWorkExperiences(user.id, id);
          scoreChannel = subscribeToScores(user.id, id);
        } catch (error) {
          console.error('Error setting up realtime subscription:', error);
          setRealtimeError('Failed to set up real-time updates. Please refresh the page.');
        }
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (scoreChannel) {
        console.log('Unsubscribing from score channel');
        supabase.removeChannel(scoreChannel);
      }
    };
  }, [user, id]);

  useEffect(() => {
    setShowSaveButton(activeTab === 'generate-draft' || activeTab === 'application-review');
  }, [activeTab]);

  const fetchFirmDetails = async () => {
    try {
      const { data, error } = await supabase.from('firms').select('*').eq('id', id).single();

      if (error) throw error;

      setFirmDetails(data);
      const firm = firms.find((f) => f.value === data.name);
      setSelectedFirm({ ...firm, id: data.id } || null);
    } catch (error) {
      console.error('Error fetching firm details:', error);
      setRealtimeError('Failed to fetch firm details. Please try refreshing the page.');
    }
  };

  const fetchWorkExperiences = async (userId, firmId) => {
    try {
      const { data, error } = await supabase
        .from('firm_user_table')
        .select('work_experience')
        .eq('user_id', userId)
        .eq('firm_id', firmId)
        .single();

      if (error) throw error;

      if (data && data.work_experience) {
        const parsedExperiences = JSON.parse(data.work_experience);
        setWorkExperiences(
          parsedExperiences.map((exp) => ({
            title: exp.title,
            duration: exp.time,
          }))
        );
      } else {
        setWorkExperiences([]);
      }
    } catch (error) {
      console.error('Error fetching work experiences:', error);
      setRealtimeError('Failed to fetch work experiences. Please try refreshing the page.');
    }
  };

  const updateWorkExperiences = async (experiences) => {
    if (!user) return;

    const formattedExperiences = experiences.map((exp) => ({
      title: exp.title,
      time: exp.duration,
    }));

    try {
      const { error } = await supabase
        .from('firm_user_table')
        .upsert(
          {
            user_id: user.id,
            firm_id: id,
            work_experience: JSON.stringify(formattedExperiences),
          },
          {
            onConflict: 'user_id,firm_id',
          }
        );

      if (error) throw error;
      setWorkExperiences(experiences);
    } catch (error) {
      console.error('Error updating work experiences:', error);
      setRealtimeError('Failed to update work experiences. Please try again.');
    }
  };

  const subscribeToScores = (userId, firmId) => {
    console.log('Attempting to subscribe to scores...');
    const channel = supabase
      .channel(`firm_user_table_changes_${userId}_${firmId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'firm_user_table',
          match: { user_id: userId, firm_id: firmId },
        },
        (payload) => {
          console.log('Received score update:', payload);
          const { new: newData } = payload;
          updateScores(newData);
        }
      )
      .subscribe();

    channel.on('status', ({ status }) => {
      console.log('Score subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to real-time score updates');
        setRealtimeError(null);
      } else if (status === 'CLOSED') {
        console.error('WebSocket connection closed');
        setRealtimeError('Real-time connection lost. Please refresh the page.');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Channel error for score updates');
        setRealtimeError('Error connecting to real-time score updates. Please try again later.');
      }
    });

    console.log('Subscribed to score channel:', channel);
    fetchScores(userId, firmId);
    return channel;
  };

  const fetchScores = async (userId, firmId) => {
    try {
      const { data, error } = await supabase
        .from('firm_user_table')
        .select(
          'weighted_score, opentext_score, education_score, workexp_score, opentext_justification, education_justification, workexp_justification'
        )
        .eq('user_id', userId)
        .eq('firm_id', firmId)
        .single();

      if (error) throw error;

      if (data) {
        console.log('Fetched initial scores:', data);
        updateScores(data);
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
      setRealtimeError('Failed to fetch scores. Please try refreshing the page.');
    }
  };

  const updateScores = (data) => {
    console.log('Updating scores with:', data);
    setScores({
      weighted_score: parseFloat(data.weighted_score) || 0,
      opentext: {
        score: parseFloat(data.opentext_score) || 0,
        justification: data.opentext_justification || '',
      },
      education: {
        score: parseFloat(data.education_score) || 0,
        justification: data.education_justification || '',
      },
      workexp: {
        score: parseFloat(data.workexp_score) || 0,
        justification: data.workexp_justification || '',
      },
    });
  };

  const handleSave = async () => {
    if (activeTab === 'generate-draft' && draftData) {
      await handleSaveDraft();
    } else if (activeTab === 'application-review' && applicationData) {
      await handleSaveApplication();
    }
  };

  const handleSaveDraft = async () => {
    if (!draftData || !user) return;

    try {
      const { error } = await supabase
        .from('drafts_generations_vector')
        .upsert(
          {
            ...draftData,
            user_id: user.id,
            firm_id: id,
          },
          {
            onConflict: 'user_id,firm_id,question',
          }
        );

      if (error) throw error;

      alert('Draft saved successfully!');
      setShowSaveButton(false);
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    }
  };

  const handleSaveApplication = async () => {
    if (!applicationData || !user) return;

    try {
      const { error } = await supabase
        .from('applications_vector')
        .upsert(
          {
            ...applicationData,
            user_id: user.id,
            firm_id: id,
          },
          {
            onConflict: 'user_id,firm_id,question',
          }
        );

      if (error) throw error;

      alert('Application saved successfully!');
      setShowSaveButton(false);
    } catch (error) {
      console.error('Error saving application:', error);
      alert('Failed to save application. Please try again.');
    }
  };

  const handleDraftChange = useCallback((newDraftData) => {
    setDraftData(newDraftData);
    setShowSaveButton(true);
  }, []);

  const handleApplicationChange = useCallback((newApplicationData) => {
    setApplicationData(newApplicationData);
    setShowSaveButton(true);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-content-firmdash">
            <div className="left-column-firmdash">
              <div className="firm-details-firmdash">
                <h2>{firmDetails?.name}</h2>
                <p>{firmDetails?.description}</p>
              </div>
              <ScoreWarnings userId={user?.id} firmId={id} />

              <div className="score-display" ref={scoreDisplayRef}>
                {scores ? (
                  <>
                    <div className="score-header">
                      <h2 className="score-title">{scores.weighted_score.toFixed(2)}</h2>
                      <p className="score-subtitle">Weighted Average Score</p>
                    </div>
                    <div className="score-content">
                      <div className="score-sections">
                        <div className="score-section">
                          <p className="section-score">{scores.opentext.score.toFixed(2)}</p>
                          <span className="section-title">Open Text Section</span>
                          <p className="section-justification">
                            {scores.opentext.justification || 'No justification available'}
                          </p>
                        </div>
                        <div className="score-section">
                          <p className="section-score">{scores.workexp.score.toFixed(2)}</p>
                          <span className="section-title">Work Experience Section</span>
                          <p className="section-justification">
                            {scores.workexp.justification || 'No justification available'}
                          </p>
                        </div>
                        <div className="score-section">
                          <p className="section-score">{scores.education.score.toFixed(2)}</p>
                          <span className="section-title">Education Section</span>
                          <p className="section-justification">
                            {scores.education.justification || 'No justification available'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>No scores available yet. Submit an application to calculate scores.</p>
                )}
              </div>
            </div>
            <div className="right-column-firmdash">
              <div ref={workExperienceRef}>
                <WorkExperience 
                  workExperiences={workExperiences} 
                  onUpdateExperiences={updateWorkExperiences}
                />
              </div>
            </div>
          </div>
        );
      case 'generate-draft':
        return <GenerateDraft firmId={id} selectedFirm={selectedFirm} onDraftChange={handleDraftChange} />;
      case 'application-review':
        return (
          <ApplicationReview firmId={id} selectedFirm={selectedFirm} onApplicationChange={handleApplicationChange} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="firm-dashboard-firmdash">
      {realtimeError && <div className="error-banner">{realtimeError}</div>}
      <div className="toolbar-firmdash">
        <div className="firm-name-firmdash">{firmDetails?.name}</div>
        <div className="tab-toggle-firmdash">
          <button
            className={`tab-button-firmdash ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`tab-button-firmdash ${activeTab === 'application-review' ? 'active' : ''}`}
            onClick={() => setActiveTab('application-review')}
          >
            Application Review
          </button>
          <button
            className={`tab-button-firmdash ${activeTab === 'generate-draft' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate-draft')}
          >
            Generate Draft
          </button>
        </div>
        <div className="save-button-container-firmdash">
          {showSaveButton && (
            <button className="save-button-firmdash" onClick={handleSave}>
              Save {activeTab === 'generate-draft' ? 'Draft' : 'Application'}
            </button>
          )}
        </div>
      </div>
      <div className="dashboard-container-firmdash">{renderContent()}</div>
    </div>
  );
};

export default FirmDashboard;