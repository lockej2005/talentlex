import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './HowDidYouHearSurvey.css';

const HowDidYouHearSurvey = () => {
  const [showSurvey, setShowSurvey] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUserSurveyStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data, error } = await supabase
          .from('profiles')
          .select('has_answered_survey')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user survey status:', error);
        } else if (data && !data.has_answered_survey) {
          setShowSurvey(true);
        }
      }
    };

    checkUserSurveyStatus();
  }, []);

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleOtherReasonChange = (event) => {
    setOtherReason(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedOption || (selectedOption === 'Other' && !otherReason)) return;

    const reference = selectedOption === 'Other' ? otherReason : selectedOption;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          has_answered_survey: true,
          reference: reference
        })
        .eq('id', user.id);

      if (error) throw error;
      setShowSurvey(false);
    } catch (error) {
      console.error('Error updating survey response:', error);
    }
  };

  if (!showSurvey) return null;

  return (
    <div className="survey-overlay">
      <div className="survey-content">
        <h2>How did you hear about us?</h2>
        <form onSubmit={handleSubmit}>
          <div className="options-container">
            <div className={`option ${selectedOption === 'LinkedIn' ? 'selected' : ''}`}>
              <input
                type="radio"
                id="linkedin"
                name="referral"
                value="LinkedIn"
                checked={selectedOption === 'LinkedIn'}
                onChange={handleOptionChange}
              />
              <label htmlFor="linkedin">LinkedIn</label>
            </div>
            <div className={`option ${selectedOption === 'Word of mouth' ? 'selected' : ''}`}>
              <input
                type="radio"
                id="wordofmouth"
                name="referral"
                value="Word of mouth"
                checked={selectedOption === 'Word of mouth'}
                onChange={handleOptionChange}
              />
              <label htmlFor="wordofmouth">Word of mouth</label>
            </div>
            <div className={`option ${selectedOption === 'Legal Cheek event' ? 'selected' : ''}`}>
              <input
                type="radio"
                id="legalcheekevent"
                name="referral"
                value="Legal Cheek event"
                checked={selectedOption === 'Legal Cheek event'}
                onChange={handleOptionChange}
              />
              <label htmlFor="legalcheekevent">Legal Cheek event</label>
            </div>
            <div className={`option ${selectedOption === 'QR code Poster' ? 'selected' : ''}`}>
              <input
                type="radio"
                id="qrcodepost"
                name="referral"
                value="QR code Poster"
                checked={selectedOption === 'QR code Poster'}
                onChange={handleOptionChange}
              />
              <label htmlFor="qrcodepost">QR code Poster</label>
            </div>
            <div className={`option ${selectedOption === 'Other' ? 'selected' : ''}`}>
              <input
                type="radio"
                id="other"
                name="referral"
                value="Other"
                checked={selectedOption === 'Other'}
                onChange={handleOptionChange}
              />
              <label htmlFor="other">Other</label>
            </div>
            {selectedOption === 'Other' && (
              <input
                type="text"
                className="other-input"
                value={otherReason}
                onChange={handleOtherReasonChange}
                placeholder="Please specify"
                required
              />
            )}
          </div>
          <button 
            type="submit" 
            className="submit-button"
            disabled={!selectedOption || (selectedOption === 'Other' && !otherReason)}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default HowDidYouHearSurvey;