import React, { useState, useEffect } from 'react';
import { Trash2, RotateCw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useParams } from 'react-router-dom';
import './WorkExperience.css';

const WorkExperience = ({ workExperiences, onUpdateExperiences }) => {
  const { id } = useParams();
  const initialExperienceState = {
    from: '',
    to: '',
    employer: '',
    position: '',
    location: '',
    sourceType: '',
    isLawRelated: false,
    details: ''
  };

  const [newExperience, setNewExperience] = useState(initialExperienceState);
  const [errors, setErrors] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
      setIsLoading(false);
    };

    getUser();
  }, []);

  if (isLoading || !userId || !id) {
    return (
      <div className="work-experience-workexp">
        <div className="work-experience-header-workexp">
          <h3>Work Experience</h3>
          <button 
            className="sync-button-workexp"
            disabled={true}
          >
            <RotateCw size={16} />
            <span>Sync from Profile</span>
          </button>
        </div>
        <div className="loading-message-workexp">
          Loading user data...
        </div>
      </div>
    );
  }

  const validateExperience = (experience) => {
    const errors = {};
    
    if (!experience.employer?.trim()) {
      errors.employer = 'Employer is required';
    }
    if (!experience.position?.trim()) {
      errors.position = 'Position is required';
    }
    if (!experience.from) {
      errors.from = 'Start date is required';
    }
    if (!experience.to) {
      errors.to = 'End date is required';
    }

    if (experience.details && experience.details.length > 250) {
      errors.details = 'Details must be less than 250 words';
    }

    return errors;
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('work_experience')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      if (!profileData?.work_experience) {
        alert('No work experience found in profile');
        setIsSyncing(false);
        return;
      }

      let profileExperiences;
      try {
        profileExperiences = JSON.parse(profileData.work_experience);
        if (!Array.isArray(profileExperiences)) {
          throw new Error('Invalid work experience format');
        }
      } catch (e) {
        console.error('Parsing error:', e);
        alert('Invalid work experience data in profile');
        setIsSyncing(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('firm_user_table')
        .upsert({
          user_id: userId,
          firm_id: id,
          work_experience: JSON.stringify(profileExperiences)
        }, {
          onConflict: 'user_id,firm_id'
        });

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      onUpdateExperiences(profileExperiences);
      alert('Work experience successfully synced from profile');
    } catch (error) {
      console.error('Error syncing work experience:', error);
      alert('Failed to sync work experience from profile. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddExperience = () => {
    const validationErrors = validateExperience(newExperience);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const updatedExperiences = [...workExperiences, newExperience];
    onUpdateExperiences(updatedExperiences);
    setNewExperience(initialExperienceState);
    setErrors({});
  };

  const handleDeleteExperience = (index) => {
    const updatedExperiences = workExperiences.filter((_, i) => i !== index);
    onUpdateExperiences(updatedExperiences);
  };

  const handleChange = (field, value) => {
    setNewExperience(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleWordCount = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const renderExperienceItem = (exp, index) => {
    return (
      <div key={index} className="experience-item-workexp">
        <div className="experience-content-workexp">
          <h4 className="experience-title-workexp">
            {exp.position || 'Position'} at {exp.employer || 'Employer'}
          </h4>
          <p className="experience-duration-workexp">
            {formatDate(exp.from)} - {formatDate(exp.to)}
          </p>
          {exp.location && (
            <p className="experience-duration-workexp">{exp.location}</p>
          )}
          {exp.sourceType && (
            <p className="experience-duration-workexp">
              Type: {exp.sourceType}
            </p>
          )}
          {exp.isLawRelated && (
            <p className="experience-duration-workexp">
              Law-related experience
            </p>
          )}
          {exp.details && (
            <p className="experience-details-workexp">{exp.details}</p>
          )}
        </div>
        <button 
          className="delete-experience-btn-workexp" 
          onClick={() => handleDeleteExperience(index)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="work-experience-workexp">
      <div className="work-experience-header-workexp">
        <h3>Work Experience</h3>
        <button 
          className={`sync-button-workexp ${isSyncing ? 'syncing' : ''}`}
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RotateCw size={16} />
          <span>Sync from Profile</span>
        </button>
      </div>

      {workExperiences.map((exp, index) => renderExperienceItem(exp, index))}
      
      <div className="add-experience-workexp">
        <div className="experience-duration-inputs-workexp">
          <div className="date-input-group-workexp">
            <label>From</label>
            <input
              type="date"
              value={newExperience.from}
              onChange={(e) => handleChange('from', e.target.value)}
              className={errors.from ? 'error' : ''}
            />
            {errors.from && <span className="error-message-workexp">{errors.from}</span>}
          </div>
          <div className="date-input-group-workexp">
            <label>To</label>
            <input
              type="date"
              value={newExperience.to}
              onChange={(e) => handleChange('to', e.target.value)}
              className={errors.to ? 'error' : ''}
            />
            {errors.to && <span className="error-message-workexp">{errors.to}</span>}
          </div>
        </div>

        <div className="input-group-workexp">
          <label>Employer</label>
          <input
            type="text"
            value={newExperience.employer}
            onChange={(e) => handleChange('employer', e.target.value)}
            className={errors.employer ? 'error' : ''}
          />
          {errors.employer && <span className="error-message-workexp">{errors.employer}</span>}
        </div>

        <div className="input-group-workexp">
          <label>Position</label>
          <input
            type="text"
            value={newExperience.position}
            onChange={(e) => handleChange('position', e.target.value)}
            className={errors.position ? 'error' : ''}
          />
          {errors.position && <span className="error-message-workexp">{errors.position}</span>}
        </div>

        <div className="input-group-workexp">
          <label>Location</label>
          <input
            type="text"
            value={newExperience.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>

        <div className="input-group-workexp">
          <label>How did you get this work experience?</label>
          <select 
            value={newExperience.sourceType}
            onChange={(e) => handleChange('sourceType', e.target.value)}
          >
            <option value="">Select</option>
            <option value="Job">Job</option>
            <option value="Internship">Internship</option>
            <option value="Volunteer">Volunteer</option>
            <option value="Project">Project</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="radio-group-workexp">
          <label>Is this law related work experience?</label>
          <div className="radio-options-workexp">
            <label>
              <input
                type="radio"
                name="isLawRelated"
                checked={newExperience.isLawRelated === true}
                onChange={() => handleChange('isLawRelated', true)}
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="isLawRelated"
                checked={newExperience.isLawRelated === false}
                onChange={() => handleChange('isLawRelated', false)}
              />
              No
            </label>
          </div>
        </div>

        <div className="input-group-workexp">
          <label>Brief details</label>
          <textarea
            value={newExperience.details}
            onChange={(e) => handleChange('details', e.target.value)}
            maxLength={1000}
            rows={4}
            className={errors.details ? 'error' : ''}
          />
          <div className="word-count-workexp">
            Word Count (Max 250 words): {handleWordCount(newExperience.details)}
          </div>
          {errors.details && <span className="error-message-workexp">{errors.details}</span>}
        </div>

        <button onClick={handleAddExperience} className="add-button-workexp">
          Add Experience
        </button>
      </div>
    </div>
  );
};

export default WorkExperience;