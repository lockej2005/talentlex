import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsLeftRight } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import ApplicationInput from './ApplicationInput';
import './ApplicationReview.css';
import {
  getCurrentUser,
  handleApplicationSubmit,
} from '../utils/ApplicationReviewUtils';
import { firms, questions } from '../data/ApplicationReviewData';
import { UserInputContext } from '../context/UserInputContext';
import { supabase } from '../supabaseClient';

function ApplicationReview({ firmId, selectedFirm, onApplicationChange }) {
  const { 
    applicationText, setApplicationText,
    selectedQuestion, setSelectedQuestion,
    feedback, setFeedback
  } = useContext(UserInputContext);

  const [leftWidth, setLeftWidth] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(null);
  const containerRef = useRef(null);
  const dividerRef = useRef(null);
  const [user, setUser] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  const getQuestions = useCallback((firm) => {
    return questions[firm] || [{ value: "Coming Soon", label: "Coming Soon" }];
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user && selectedFirm) {
      const firmQuestions = getQuestions(selectedFirm.value);
      setSelectedQuestion(firmQuestions[0]);
    }
  }, [user, selectedFirm, getQuestions, setSelectedQuestion]);

  useEffect(() => {
    if (user && selectedFirm && selectedQuestion) {
      loadSavedReview(user.id, selectedFirm.value, selectedQuestion.value);
    }
  }, [user, selectedFirm, selectedQuestion]);

  useEffect(() => {
    const calculateWordCount = (text) => {
      return text.trim().split(/\s+/).filter(word => word !== '').length;
    };
    setWordCount(calculateWordCount(applicationText));
  }, [applicationText]);

  const loadSavedReview = async (userId, firmId, questionValue) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications_vector')
        .select('*')
        .eq('user_id', userId)
        .eq('firm_id', firmId)
        .eq('question', questionValue)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setApplicationText(data.application_text || '');
        setFeedback(data.feedback || '');
      } else {
        setApplicationText('');
        setFeedback('');
      }
    } catch (error) {
      console.error('Error loading saved review:', error.message);
      setApplicationText('');
      setFeedback('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      setLeftWidth(Math.min(Math.max(newLeftWidth, 20), 80));
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      alert('Please log in to submit your application.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await handleApplicationSubmit(
        user,
        applicationText,
        selectedFirm,
        selectedQuestion,
        setFeedback,
        setTotalTokens,
        setResponseTime
      );
      setFeedback(prevFeedback => `${prevFeedback}\n\nCredits used: ${result.cost}. Remaining credits: ${result.newBalance}`);
      updateApplicationData();
    } catch (error) {
      console.error("Error:", error);
      setFeedback("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateApplicationData = useCallback(() => {
    if (onApplicationChange && user && selectedFirm && selectedQuestion) {
      onApplicationChange({
        user_id: user.id,
        firm_id: selectedFirm.value,
        question: selectedQuestion.value,
        application_text: applicationText,
        feedback: feedback,
        timestamp: new Date().toISOString()
      });
    }
  }, [onApplicationChange, user, selectedFirm, selectedQuestion, applicationText, feedback]);

  useEffect(() => {
    updateApplicationData();
  }, [updateApplicationData]);

  const handleQuestionChange = useCallback((newQuestion) => {
    setSelectedQuestion(newQuestion);
    if (user && selectedFirm) {
      loadSavedReview(user.id, selectedFirm.value, newQuestion.value);
    }
  }, [user, selectedFirm, setSelectedQuestion]);

  return (
    <div className="comparison-container">
      <div className="content" ref={containerRef}>
        <div className="left-column" style={{width: `${leftWidth}%`}}>
          <ApplicationInput
            applicationText={applicationText}
            setApplicationText={setApplicationText}
            selectedFirm={selectedFirm}
            selectedQuestion={selectedQuestion}
            setSelectedQuestion={handleQuestionChange}
            firms={firms}
            getQuestions={getQuestions}
            wordCount={wordCount}
            inputType="simple"
            onQuestionChange={handleQuestionChange}
          />
        </div>
        <div className="divider" ref={dividerRef} onMouseDown={handleMouseDown}>
          <div className="divider-line top"></div>
          <div className="divider-handle">
            <FontAwesomeIcon icon={faArrowsLeftRight} />
          </div>
          <div className="divider-line bottom"></div>
        </div>
        <div className="right-column" style={{width: `${100 - leftWidth}%`}}>
          <div className="button-container">
            <button className="submit-button2" onClick={handleSubmit} disabled={isLoading || !user}>
              {isLoading ? 'Sending...' : 'Send for Review'}
            </button>
          </div>
          <div className="title-card">
            <h3>Your Review</h3>
            <p className="subtext">
              {isLoading ? '⏳🙄👀' : 
               feedback ? `Your review took ${responseTime ? responseTime.toFixed(2) : '...'} seconds to generate` : 
               'Review will pop up on this side.'}
            </p>
          </div>
          <div className="text-content">
            {feedback ? (
              <ReactMarkdown>{feedback}</ReactMarkdown>
            ) : (
              <p>{isLoading ? 'Generating your review...' : 'Submit your application to receive feedback.'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicationReview;