import React, { useState, useRef, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

function ApplicationReview() {
  const { firm: firmName } = useParams();
  const navigate = useNavigate();
  const { 
    applicationText, setApplicationText,
    reviewSelectedFirm, setReviewSelectedFirm,
    reviewSelectedQuestion, setReviewSelectedQuestion,
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
  const [isEdited, setIsEdited] = useState(false);

  const getQuestions = (firm) => {
    return questions[firm] || [{ value: "Coming Soon", label: "Coming Soon" }];
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser && firmName) {
        loadSavedReview(currentUser.email, firmName);
      }
    };

    fetchCurrentUser();
  }, [firmName]);

  useEffect(() => {
    if (!reviewSelectedFirm && firmName) {
      const firm = firms.find(f => f.label === firmName);
      setReviewSelectedFirm(firm || firms[0]);
    }
  }, [reviewSelectedFirm, firmName, setReviewSelectedFirm]);

  useEffect(() => {
    if (reviewSelectedFirm && !reviewSelectedQuestion) {
      const firmQuestions = getQuestions(reviewSelectedFirm.value);
      setReviewSelectedQuestion(firmQuestions[0]);
    }
  }, [reviewSelectedFirm, reviewSelectedQuestion, setReviewSelectedQuestion]);

  useEffect(() => {
    const calculateWordCount = (text) => {
      return text.trim().split(/\s+/).filter(word => word !== '').length;
    };
    setWordCount(calculateWordCount(applicationText));
  }, [applicationText]);

  const loadSavedReview = async (email, firm) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications_vector')
        .select('*')
        .eq('email', email)
        .eq('firm', firm)
        .single();

      if (error) throw error;

      if (data) {
        setApplicationText(data.application_text || '');
        setFeedback(data.feedback || '');
        const selectedFirm = firms.find(f => f.label === data.firm);
        if (selectedFirm) {
          setReviewSelectedFirm(selectedFirm);
          const firmQuestions = getQuestions(selectedFirm.value);
          const selectedQuestion = firmQuestions.find(q => q.value === data.question);
          if (selectedQuestion) {
            setReviewSelectedQuestion(selectedQuestion);
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved review:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReview = async () => {
    if (!user || !reviewSelectedFirm) {
      alert('Please select a firm and ensure you are logged in.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('applications_vector')
        .upsert({
          email: user.email,
          firm: reviewSelectedFirm.label,
          question: reviewSelectedQuestion?.value || '',
          application_text: applicationText,
          feedback: feedback,
          device: 'web',
          screen_size: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: new Date().toISOString()
        }, {
          onConflict: 'email,firm'
        })
        .select();

      if (error) throw error;

      alert('Application saved successfully!');
      setIsEdited(false);
    } catch (error) {
      console.error('Error saving application:', error.message);
      alert('Failed to save application. Please try again.');
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
        reviewSelectedFirm,
        reviewSelectedQuestion,
        setFeedback,
        setTotalTokens,
        setResponseTime
      );
      setFeedback(prevFeedback => `${prevFeedback}\n\nCredits used: ${result.cost}. Remaining credits: ${result.newBalance}`);
      setIsEdited(true);
    } catch (error) {
      console.error("Error:", error);
      setFeedback("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="comparison-container">
      <div className="save-toolbar">
        <div className="draft-title">{reviewSelectedFirm?.label || 'Select a Firm'}</div>
        <button onClick={handleSaveReview} disabled={!isEdited}>Save Application</button>
      </div>
      <div className="content" ref={containerRef}>
        <div className="left-column" style={{width: `${leftWidth}%`}}>
          <ApplicationInput
            applicationText={applicationText}
            setApplicationText={(text) => {
              setApplicationText(text);
              setIsEdited(true);
            }}
            selectedFirm={reviewSelectedFirm}
            setSelectedFirm={setReviewSelectedFirm}
            selectedQuestion={reviewSelectedQuestion}
            setSelectedQuestion={setReviewSelectedQuestion}
            firms={firms}
            getQuestions={getQuestions}
            wordCount={wordCount}
            inputType="simple"
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