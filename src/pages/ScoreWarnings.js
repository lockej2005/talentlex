import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './ScoreWarnings.css';

const ScoreWarnings = ({ userId, firmId }) => {
  const [warnings, setWarnings] = useState([]);
  const [successes, setSuccesses] = useState([]);

  useEffect(() => {
    const fetchWarningsAndSuccesses = async () => {
      if (!userId || !firmId) return;

      const newWarnings = [];
      const newSuccesses = [];

      // Check profile information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('education, undergraduate_grades, sub_categories')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile data:', profileError);
      } else {
        if (!profileData.education || profileData.education.trim() === '') {
          newWarnings.push("Your education information is missing. Please add your educational background to improve your application.");
        } else {
          newSuccesses.push("Great job! Your education information is provided.");
        }

        if (!profileData.undergraduate_grades || profileData.undergraduate_grades.trim() === '') {
          newWarnings.push("Your undergraduate grades are not provided. Add this informaiton in the Profile Tab");
        } else {
          newSuccesses.push("Excellent! You've included your undergraduate grades.");
        }

        if (!profileData.sub_categories || profileData.sub_categories.length === 0) {
          newWarnings.push("You haven't selected any sub-categories. Choosing relevant sub-categories can help tailor your application.");
        } else {
          newSuccesses.push("Well done! You've selected sub-categories to tailor your application.");
        }
      }

      // Check work experience
      const { data: workExperienceData, error: workExperienceError } = await supabase
        .from('firm_user_table')
        .select('work_experience')
        .eq('user_id', userId)
        .eq('firm_id', firmId)
        .single();

      if (workExperienceError) {
        console.error('Error fetching work experience data:', workExperienceError);
      } else {
        if (!workExperienceData.work_experience || workExperienceData.work_experience.trim() === '[]') {
          newWarnings.push("You haven't added any work experience for this firm. Adding relevant work experience can significantly improve your application.");
        } else {
          newSuccesses.push("Fantastic! You've added work experience for this firm, which strengthens your application.");
        }
      }

      setWarnings(newWarnings);
      setSuccesses(newSuccesses);
    };

    fetchWarningsAndSuccesses();
  }, [userId, firmId]);

  if (warnings.length === 0 && successes.length === 0) {
    return null;
  }

  return (
    <div className="score-warnings-container">
      {warnings.map((warning, index) => (
        <div key={`warning-${index}`} className="warning-box-warning">
          <AlertTriangle className="warning-icon-warning" />
          <p className="warning-text-warning">{warning}</p>
        </div>
      ))}
      {successes.map((success, index) => (
        <div key={`success-${index}`} className="success-box-warning">
          <CheckCircle className="success-icon-warning" />
          <p className="success-text-warning">{success}</p>
        </div>
      ))}
    </div>
  );
};

export default ScoreWarnings;