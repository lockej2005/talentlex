import React, { useState, useEffect } from 'react';
import { Trash2, RotateCw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useLocation, useParams } from 'react-router-dom';
import './WorkExperience.css';

const WorkExperience = () => {  // Removed unused props
  const location = useLocation();
  const { id: firmId } = useParams();
  const isMainView = location.pathname === '/work-experience';
  
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
  const [isLoading, setIsLoading] = useState(true);
  const [workExperiences, setWorkExperiences] = useState([]);
  const [userId, setUserId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let timeoutId;
    if (successMessage) {
      timeoutId = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [successMessage]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        if (isMainView) {
          await fetchProfileWorkExperiences(user.id);
        } else if (firmId) {
          await fetchFirmWorkExperiences(user.id, firmId);
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [isMainView, firmId]);

  const fetchProfileWorkExperiences = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('work_experience')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data?.work_experience) {
        setWorkExperiences(JSON.parse(data.work_experience));
      } else {
        setWorkExperiences([]);
      }
    } catch (error) {
      console.error('Error fetching profile work experiences:', error);
    }
  };

  const fetchFirmWorkExperiences = async (userId, firmId) => {
    try {
      const { data, error } = await supabase
        .from('firm_user_table')
        .select('work_experience')
        .eq('user_id', userId)
        .eq('firm_id', firmId)
        .single();

      if (error) throw error;

      if (data?.work_experience) {
        setWorkExperiences(JSON.parse(data.work_experience));
      } else {
        setWorkExperiences([]);
      }
    } catch (error) {
      console.error('Error fetching firm work experiences:', error);
    }
  };

  const handleSync = async () => {
    if (!userId || !firmId) return;

    setIsSyncing(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('work_experience')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      if (!profileData?.work_experience) {
        setSuccessMessage('No work experience found in profile');
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
        setSuccessMessage('Failed to sync experience data');
        return;
      }

      const { error: updateError } = await supabase
        .from('firm_user_table')
        .upsert({
          user_id: userId,
          firm_id: firmId,
          work_experience: JSON.stringify(profileExperiences)
        }, {
          onConflict: 'user_id,firm_id'
        });

      if (updateError) throw updateError;

      setWorkExperiences(profileExperiences);
      setSuccessMessage('Experience successfully synced from profile');

    } catch (error) {
      console.error('Error syncing work experience:', error);
      setSuccessMessage('Failed to sync experience data');
    } finally {
      setIsSyncing(false);
    }
  };

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

    if (experience.details && experience.details.length > 1000) {
      errors.details = 'Details must be less than 1000 characters';
    }

    return errors;
  };

  const handleAddExperience = async () => {
    const validationErrors = validateExperience(newExperience);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const updatedExperiences = [...workExperiences, {
        from: newExperience.from,
        to: newExperience.to,
        employer: newExperience.employer,
        position: newExperience.position,
        location: newExperience.location,
        sourceType: newExperience.sourceType,
        isLawRelated: newExperience.isLawRelated,
        details: newExperience.details
      }];

      if (isMainView) {
        const { error } = await supabase
          .from('profiles')
          .update({
            work_experience: JSON.stringify(updatedExperiences)
          })
          .eq('id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('firm_user_table')
          .upsert({
            user_id: userId,
            firm_id: firmId,
            work_experience: JSON.stringify(updatedExperiences)
          }, {
            onConflict: 'user_id,firm_id'
          });

        if (error) throw error;
      }

      setWorkExperiences(updatedExperiences);
      setNewExperience(initialExperienceState);
      setErrors({});
      setSuccessMessage('Experience successfully added');
    } catch (error) {
      console.error('Error adding work experience:', error);
      setSuccessMessage('Failed to add experience');
    }
  };

  const handleDeleteExperience = async (index) => {
    try {
      const updatedExperiences = workExperiences.filter((_, i) => i !== index);

      if (isMainView) {
        const { error } = await supabase
          .from('profiles')
          .update({
            work_experience: JSON.stringify(updatedExperiences)
          })
          .eq('id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('firm_user_table')
          .upsert({
            user_id: userId,
            firm_id: firmId,
            work_experience: JSON.stringify(updatedExperiences)
          }, {
            onConflict: 'user_id,firm_id'
          });

        if (error) throw error;
      }

      setWorkExperiences(updatedExperiences);
      setSuccessMessage('Experience successfully deleted');
    } catch (error) {
      console.error('Error deleting work experience:', error);
      setSuccessMessage('Failed to delete experience');
    }
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

  if (isLoading) {
    return (
      <div className="spinner-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  

  const content = (
    <div className="work-experience-workexp">
      <div className="work-experience-header-workexp">
        <h3>Work Experience</h3>
        {!isMainView && (
          <button 
            className={`sync-button-workexp ${isSyncing ? 'syncing' : ''}`}
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RotateCw size={16} />
            <span>Sync from Profile</span>
          </button>
        )}
      </div>
      
      {successMessage && (
        <div className="success-message-workexp fade-out">
          {successMessage}
        </div>
      )}

      {workExperiences.map((exp, index) => (
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
      ))}
      
      <div className="add-experience-workexp">
      <div className="experience-duration-inputs-workexp">
        <div className="date-input-group-workexp">
            <label>From</label>
            <input
            type="month"
            value={newExperience.from}
            onChange={(e) => handleChange('from', e.target.value)}
            className={errors.from ? 'error' : ''}
            />
            {errors.from && <span className="error-message-workexp">{errors.from}</span>}
        </div>
        <div className="date-input-group-workexp">
            <label>To</label>
            <input
            type="month"
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
          {errors.details && <span className="error-message-workexp">{errors.details}</span>}
        </div>

        <button onClick={handleAddExperience} className="add-button-workexp">
          Add Experience
        </button>
      </div>
      </div>
  );

  return isMainView ? (
    <div className="work-experience-page-container">
      {content}
    </div>
) : content;
};

export default WorkExperience;