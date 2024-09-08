import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import GenerateDraft from './GenerateDraft';
import ApplicationReview from './ApplicationReview';
import ScoreWarnings from './ScoreWarnings';
import { firms } from '../data/ApplicationReviewData';
import { Trash2 } from 'lucide-react';
import './FirmDashboard.css';

const FirmDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [firmDetails, setFirmDetails] = useState(null);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [applicationData, setApplicationData] = useState(null);
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [workExperiences, setWorkExperiences] = useState([]);
  const [newExperience, setNewExperience] = useState({ title: '', duration: '' });
  const [user, setUser] = useState(null);
  const [scores, setScores] = useState(null);
  const { id } = useParams();
  const workExperienceRef = useRef(null);
  const scoreDisplayRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (user && id) {
      fetchFirmDetails();
      fetchWorkExperiences(user.id, id);
      calculateScores(user.id, id);
    }
  }, [user, id]);

  useEffect(() => {
    setShowSaveButton(activeTab === 'generate-draft' || activeTab === 'application-review');
  }, [activeTab]);

  const fetchFirmDetails = async () => {
    const { data, error } = await supabase
      .from('firms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching firm details:', error);
    } else {
      setFirmDetails(data);
      const firm = firms.find(f => f.value === data.name);
      setSelectedFirm(firm || null);
    }
  };

  const fetchWorkExperiences = async (userId, firmId) => {
    const { data, error } = await supabase
      .from('firm_user_table')
      .select('work_experience')
      .eq('user_id', userId)
      .eq('firm_id', firmId)
      .single();

    if (error) {
      console.error('Error fetching work experiences:', error);
      setWorkExperiences([]);
    } else if (data && data.work_experience) {
      const parsedExperiences = JSON.parse(data.work_experience);
      setWorkExperiences(parsedExperiences.map(exp => ({
        title: exp.title,
        duration: exp.time
      })));
    } else {
      setWorkExperiences([]);
    }
  };

  const updateWorkExperiences = async (experiences) => {
    if (!user) return;

    const formattedExperiences = experiences.map(exp => ({
      title: exp.title,
      time: exp.duration
    }));
    
    const { error } = await supabase
      .from('firm_user_table')
      .upsert({
        user_id: user.id,
        firm_id: id,
        work_experience: JSON.stringify(formattedExperiences)
      }, {
        onConflict: 'user_id,firm_id'
      });

    if (error) {
      console.error('Error updating work experiences:', error);
    } else {
      fetchWorkExperiences(user.id, id);
    }
  };

  const calculateScores = async (userId, firmId) => {
    try {
      // Fetch firm details including prompts and models
      const { data: firmData, error: firmError } = await supabase
        .from('firms')
        .select('workexp_model, workexp_prompt, opentext_model, opentext_prompt, education_model, education_prompt, name')
        .eq('id', firmId)
        .single();

      if (firmError) throw firmError;

      // Fetch open text applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications_vector')
        .select('question, application_text')
        .eq('firm_id', firmData.name)
        .eq('user_id', userId);

      if (applicationsError) throw applicationsError;

      // Fetch education details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('education, sub_categories, undergraduate_grades')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch work experience
      const { data: workExpData, error: workExpError } = await supabase
        .from('firm_user_table')
        .select('work_experience')
        .eq('user_id', userId)
        .eq('firm_id', firmId)
        .single();

      if (workExpError) throw workExpError;

      // Prepare data for backend
      const openTextContent = applicationsData.map(app => `Question: ${app.question}\nAnswer: ${app.application_text}`).join('\n\n');
      const educationContent = `Education: ${profileData.education || 'N/A'}\nSub-categories: ${Array.isArray(profileData.sub_categories) ? profileData.sub_categories.join(', ') : (profileData.sub_categories || 'N/A')}\nUndergraduate Grades: ${profileData.undergraduate_grades || 'N/A'}`;
      const workExpContent = workExpData.work_experience || '[]';

      // Send data to backend for score calculation
      const response = await fetch('http://localhost:5000/calculate_score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workexp_content: workExpContent,
          workexp_model: firmData.workexp_model,
          workexp_prompt: firmData.workexp_prompt,
          opentext_content: openTextContent,
          opentext_model: firmData.opentext_model,
          opentext_prompt: firmData.opentext_prompt,
          education_content: educationContent,
          education_model: firmData.education_model,
          education_prompt: firmData.education_prompt
        }),
      });

      if (!response.ok) throw new Error('Failed to calculate scores');

      const scoreData = await response.json();
      setScores(scoreData);
    } catch (error) {
      console.error('Error calculating scores:', error);
      setScores(null);
    }
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
      const { data, error } = await supabase
        .from('drafts_generations_vector')
        .upsert({
          ...draftData,
          user_id: user.id,
          firm_id: id
        }, {
          onConflict: 'user_id,firm_id,question'
        })
        .select();

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
      const { data, error } = await supabase
        .from('applications_vector')
        .upsert({
          ...applicationData,
          user_id: user.id,
          firm_id: id
        }, {
          onConflict: 'user_id,firm_id'
        })
        .select();
  
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

  const handleAddExperience = () => {
    if (newExperience.title && newExperience.duration) {
      const updatedExperiences = [...workExperiences, newExperience];
      setWorkExperiences(updatedExperiences);
      updateWorkExperiences(updatedExperiences);
      setNewExperience({ title: '', duration: '' });
    }
  };

  const handleDeleteExperience = (index) => {
    const updatedExperiences = workExperiences.filter((_, i) => i !== index);
    setWorkExperiences(updatedExperiences);
    updateWorkExperiences(updatedExperiences);
  };

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
                          <p className="section-score">{scores.opentext.score}</p>
                          <span className="section-title">Open Text Section</span>
                          <p className="section-detail">{scores.opentext.justification}</p>
                        </div>
                        <div className="score-section">
                          <p className="section-score">{scores.workexp.score}</p>
                          <span className="section-title">Work Experience Section</span>
                          <p className="section-detail">{scores.workexp.justification}</p>
                        </div>
                        <div className="score-section">
                          <p className="section-score">{scores.education.score}</p>
                          <span className="section-title">Education Section</span>
                          <p className="section-detail">{scores.education.justification}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>Loading scores...</p>
                )}
              </div>
            </div>
            <div className="right-column-firmdash">
              <ScoreWarnings userId={user?.id} firmId={id} />
              <div className="work-experience-firmdash" ref={workExperienceRef}>
                <h3>Work Experience</h3>
                {workExperiences.map((exp, index) => (
                  <div key={index} className="experience-item">
                    <div className="experience-content">
                      <h4 className="experience-title">{exp.title}</h4>
                      <p className="experience-duration">{exp.duration}</p>
                    </div>
                    <button className="delete-experience-btn" onClick={() => handleDeleteExperience(index)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <div className="add-experience">
                  <textarea 
                    placeholder="Job Title and Company" 
                    value={newExperience.title}
                    onChange={(e) => setNewExperience({...newExperience, title: e.target.value})}
                    rows="2"
                  />
                  <input 
                    type="text" 
                    placeholder="Duration/Dates" 
                    value={newExperience.duration}
                    onChange={(e) => setNewExperience({...newExperience, duration: e.target.value})}
                  />
                  <button onClick={handleAddExperience}>+</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'generate-draft':
        return <GenerateDraft firmId={id} selectedFirm={selectedFirm} onDraftChange={handleDraftChange} />;
      case 'application-review':
        return <ApplicationReview firmId={id} selectedFirm={selectedFirm} onApplicationChange={handleApplicationChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="firm-dashboard-firmdash">
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
            className={`tab-button-firmdash ${activeTab === 'generate-draft' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate-draft')}
          >
            Generate Draft
          </button>
          <button
            className={`tab-button-firmdash ${activeTab === 'application-review' ? 'active' : ''}`}
            onClick={() => setActiveTab('application-review')}
          >
            Application Review
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
      <div className="dashboard-container-firmdash">
        {renderContent()}
      </div>
    </div>
  );
};

export default FirmDashboard;