import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import GenerateDraft from './GenerateDraft';
import ApplicationReview from './ApplicationReview';
import './FirmDashboard.css';
import { firms } from '../data/ApplicationReviewData';

const FirmDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [firmDetails, setFirmDetails] = useState(null);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [applicationData, setApplicationData] = useState(null);
  const [selectedFirm, setSelectedFirm] = useState(null);
  const { id } = useParams();

  useEffect(() => {
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

    fetchFirmDetails();
  }, [id]);

  useEffect(() => {
    setShowSaveButton(activeTab === 'generate-draft' || activeTab === 'application-review');
  }, [activeTab]);

  const handleSave = async () => {
    if (activeTab === 'generate-draft' && draftData) {
      await handleSaveDraft();
    } else if (activeTab === 'application-review' && applicationData) {
      await handleSaveApplication();
    }
  };

  const handleSaveDraft = async () => {
    if (!draftData) return;

    try {
      const { data, error } = await supabase
        .from('drafts_generations_vector')
        .upsert(draftData, {
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
    if (!applicationData) return;
  
    try {
      const { data, error } = await supabase
        .from('applications_vector')
        .upsert(applicationData, {
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-content-firmdash">
            <div className="firm-details-firmdash">
              <h2>{firmDetails?.name}</h2>
              <p>{firmDetails?.description}</p>
            </div>
            <div className="firm-score-firmdash">
              <h3>Score</h3>
              <div className="score-circle-firmdash">70</div>
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