import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsLeftRight } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import ApplicationInput from './ApplicationInput';
import './ApplicationReview.css';
import {
  getCurrentUser,
  getUserData,
  saveUserData,
  handleApplicationSubmit,
  handleDraftCreation
} from '../utils/ApplicationReviewUtils';
import { firms, questions } from '../data/ApplicationReviewData';

function ApplicationReview() {
  const [leftWidth, setLeftWidth] = useState(50);
  const [applicationText, setApplicationText] = useState("Enter your application here or generate a draft.");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState(firms[0]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef(null);
  const dividerRef = useRef(null);
  const [additionalInfo, setAdditionalInfo] = useState({
    keyReasons: '',
    relevantExperience: '',
    relevantInteraction: '',
    personalInfo: ''
  });
  const [user, setUser] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  const getQuestions = (firm) => {
    return questions[firm] || [{ value: "Coming Soon", label: "Coming Soon" }];
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const firmQuestions = getQuestions(selectedFirm.value);
    setSelectedQuestion(firmQuestions[0]);
  }, [selectedFirm]);

  useEffect(() => {
    const calculateWordCount = (text) => {
      return text.trim().split(/\s+/).filter(word => word !== '').length;
    };
    setWordCount(calculateWordCount(applicationText));
  }, [applicationText]);

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const data = await getUserData(user.id);
          if (data) {
            setApplicationText(data.application_text);
            setFeedback(data.feedback);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    if (user) {
      saveUserData(user.id, applicationText, feedback).catch(error => {
        console.error('Error saving user data:', error);
      });
    }
  }, [applicationText, feedback, user]);

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
    } catch (error) {
      console.error("Error:", error);
      setFeedback("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdditionalInfoChange = (field, value) => {
    setAdditionalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateDraft = async () => {
    if (!user) {
      alert('Please log in to generate a draft.');
      return;
    }

    const areAllFieldsFilled = Object.values(additionalInfo).every((field) => field.trim() !== '');

    if (!areAllFieldsFilled) {
      setIsExpanded(true);
      alert('Please fill out all the additional information fields before generating a draft.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await handleDraftCreation(
        user,
        selectedFirm,
        selectedQuestion,
        additionalInfo,
        setApplicationText,
        setTotalTokens,
        setFeedback
      );
      setFeedback(`Draft generated successfully. Credits used: ${result.cost}. Remaining credits: ${result.newBalance}`);
    } catch (error) {
      console.error('Error:', error);
      setFeedback("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="comparison-container">
      <div className="header">
      </div>
      <div className="divider2"></div>

      <div className="content" ref={containerRef}>
        <div className="left-column" style={{width: `${leftWidth}%`}}>
          <ApplicationInput
            applicationText={applicationText}
            setApplicationText={setApplicationText}
            selectedFirm={selectedFirm}
            setSelectedFirm={setSelectedFirm}
            selectedQuestion={selectedQuestion}
            setSelectedQuestion={setSelectedQuestion}
            firms={firms}
            getQuestions={getQuestions}
            additionalInfo={additionalInfo}
            onAdditionalInfoChange={handleAdditionalInfoChange}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            wordCount={wordCount}
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
            <button className="submit-button" onClick={handleSubmit} disabled={isLoading || !user}>
              {isLoading ? 'Sending...' : 'Send for Review'}
            </button>
            <button className="submit-button" onClick={handleCreateDraft} disabled={isLoading || !user}>
              {isLoading ? 'Generating...' : 'Generate a Draft'}
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