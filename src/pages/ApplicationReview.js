import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsLeftRight } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import ApplicationInput from './ApplicationInput';
import './ApplicationReview.css';
import {
  getCurrentUser,
  handleApplicationSubmit,
  calculateAndUpdateScores
} from '../utils/ApplicationReviewUtils';
import { UserInputContext } from '../context/UserInputContext';
import { supabase } from '../supabaseClient';
// sample comment
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
  const [questions, setQuestions] = useState([]);
  const [actualFirmId, setActualFirmId] = useState(null);
  const [existingRecordId, setExistingRecordId] = useState(null);
  const [error, setError] = useState(null);
  const [firmName, setFirmName] = useState(null);

  const fetchFirmNameAndQuestions = useCallback(async (firmId) => {
    if (!firmId) {
      console.error('Firm ID is undefined');
      setError('Invalid firm ID. Please select a valid firm.');
      return;
    }

    try {
      const { data: firmData, error: firmError } = await supabase
        .from('firms')
        .select('name')
        .eq('id', firmId)
        .single();

      if (firmError) throw firmError;
      if (!firmData) {
        console.error('No firm found with ID:', firmId);
        setError(`No firm found with ID: ${firmId}`);
        return;
      }

      setFirmName(firmData.name);

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('firm', firmData.name)
        .order('priority', { ascending: true });

      if (questionsError) throw questionsError;

      const formattedQuestions = questionsData.map((q) => ({
        value: q.question,
        label: q.question,
        priority: q.priority
      }));

      setQuestions(formattedQuestions);
      if (formattedQuestions.length > 0) {
        setSelectedQuestion(formattedQuestions[0]);
      }
    } catch (error) {
      console.error('Error fetching firm name and questions:', error);
      setError('Failed to fetch firm information and questions. Please try again later.');
    }
  }, [setSelectedQuestion]);

  const fetchActualFirmId = useCallback(async (firmId) => {
    setActualFirmId(firmId);
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching current user:', error);
        setError('Failed to fetch user information. Please try logging in again.');
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedFirm && selectedFirm.id) {
      console.log("Selected Firm:", selectedFirm);
      fetchFirmNameAndQuestions(selectedFirm.id);
      fetchActualFirmId(selectedFirm.id);
    }
  }, [selectedFirm, fetchFirmNameAndQuestions, fetchActualFirmId]);

  useEffect(() => {
    if (user && actualFirmId && selectedQuestion) {
      loadSavedReview(user.id, actualFirmId, selectedQuestion.value);
    }
  }, [user, actualFirmId, selectedQuestion]);

  useEffect(() => {
    const calculateWordCount = (text) => {
      return text.trim().split(/\s+/).filter(word => word !== '').length;
    };
    setWordCount(calculateWordCount(applicationText));
  }, [applicationText]);

  const loadSavedReview = async (userId, firmId, questionValue) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('applications_vector')
        .select('*')
        .eq('user_id', userId)
        .eq('firm_id', firmId)
        .eq('question', questionValue)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setApplicationText('');
          setFeedback('');
          setExistingRecordId(null);
        } else {
          throw error;
        }
      } else if (data) {
        setApplicationText(data.application_text || '');
        setFeedback(data.feedback || '');
        setExistingRecordId(data.id);
      }
    } catch (error) {
      console.error('Error loading saved review:', error.message);
      setError('Failed to load saved review. Please try again later.');
      setApplicationText('');
      setFeedback('');
      setExistingRecordId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReview = async (userId, firmId, questionValue, applicationText, newFeedback) => {
    setError(null);
    try {
      let upsertData = {
        user_id: userId,
        firm_id: firmId,
        question: questionValue,
        application_text: applicationText,
        feedback: newFeedback,
        timestamp: new Date().toISOString()
      };

      // First, insert into applications_vector_history
      const { error: historyError } = await supabase
        .from('applications_vector_history')
        .insert(upsertData);

      if (historyError) throw historyError;

      // Then, update or insert into applications_vector
      if (existingRecordId) {
        const { error } = await supabase
          .from('applications_vector')
          .update(upsertData)
          .eq('id', existingRecordId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('applications_vector')
          .insert(upsertData)
          .select();

        if (error) throw error;
        if (data && data[0]) {
          setExistingRecordId(data[0].id);
        }
      }

      console.log('Review saved successfully');
    } catch (error) {
      console.error('Error saving review:', error.message);
      setError('Failed to save review. Please try again later.');
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
    setError(null);
    try {
      console.log('Submitting application...');
      const result = await handleApplicationSubmit(
        user,
        applicationText,
        { id: actualFirmId, name: firmName },
        selectedQuestion
      );
      console.log('Application submitted, result:', result);
  
      if (result && result.success) {
        const newFeedback = `${result.feedback}\n\nCredits used: ${result.usage.total_tokens}. Remaining credits: ${result.newBalance}`;
        setFeedback(newFeedback);
        setResponseTime(result.responseTime);
        setTotalTokens(result.usage.total_tokens);
  
        console.log('Saving review...');
        await saveReview(user.id, actualFirmId, selectedQuestion.value, applicationText, newFeedback);
        console.log('Review saved');
        
        updateApplicationData();
      } else {
        throw new Error('Unexpected response format from server');
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setError(`An error occurred: ${error.message}`);
      setFeedback("");
    } finally {
      setIsLoading(false);
    }
  };

  const updateApplicationData = useCallback(() => {
    if (onApplicationChange && user && actualFirmId && selectedQuestion) {
      onApplicationChange({
        user_id: user.id,
        firm_id: actualFirmId,
        question: selectedQuestion.value,
        application_text: applicationText,
        feedback: feedback,
        timestamp: new Date().toISOString()
      });
    }
  }, [onApplicationChange, user, actualFirmId, selectedQuestion, applicationText, feedback]);

  const handleQuestionChange = useCallback((newQuestion) => {
    setSelectedQuestion(newQuestion);
    if (user && actualFirmId) {
      loadSavedReview(user.id, actualFirmId, newQuestion.value);
    }
  }, [user, actualFirmId]);

  return (
    <div className="comparison-container">
      <div className="content" ref={containerRef}>
        <div className="left-column" style={{width: `${leftWidth}%`}}>
          <ApplicationInput
            applicationText={applicationText}
            setApplicationText={setApplicationText}
            selectedQuestion={selectedQuestion}
            setSelectedQuestion={setSelectedQuestion}
            questions={questions}
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
            <h3>Your Review for {firmName}</h3>
            <p className="subtext">
              {isLoading ? '⏳🙄👀' : 
               feedback ? `Your review took ${responseTime ? responseTime.toFixed(2) : '...'} seconds to generate` : 
               'Review will pop up on this side.'}
            </p>
          </div>
          <div className="text-content">
            {error ? (
              <p className="error-message">{error}</p>
            ) : feedback ? (
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