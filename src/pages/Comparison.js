import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsLeftRight } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import { loadStripe } from '@stripe/stripe-js';
import { createClient } from '@supabase/supabase-js';
import EmailPopup from './EmailPopup';
import ApplicationInput from './ApplicationInput';
import './comparison.css';

// Initialize Stripe
const stripePromise = loadStripe('pk_live_51P4eASP1v3Dm1cKPvctekur3arCo5DAO0Bdgk9cHm1V4i3MPJWnFTS94UsfF45bUUlilPdShd2TdpLNht3IZBhXI00lZTdbwPr');

// Initialize Supabase
const supabaseUrl = 'https://atbphpeswwgqvwlbplko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YnBocGVzd3dncXZ3bGJwbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMyNzY2MDksImV4cCI6MjAzODg1MjYwOX0.Imv3PmtGs9pGt6MvrvscR6cuv6WWCXKsSvwTZGjF4xU';
const supabase = createClient(supabaseUrl, supabaseKey);

function Comparison() {
  const [leftWidth, setLeftWidth] = useState(50);
  const [applicationText, setApplicationText] = useState("Enter your application here or generate a draft.");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState({ value: "Goodwin", label: "Goodwin" });
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const containerRef = useRef(null);
  const dividerRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState({
    keyReasons: '',
    relevantExperience: '',
    relevantInteraction: '',
    personalInfo: ''
  });

  const firms = [
    { value: "Goodwin", label: "Goodwin" },
    { value: "Jones Day", label: "Jones Day" },
    { value: "White & Case", label: "White & Case" },
    { value: "Sidley Austin", label: "Sidley Austin" },
    { value: "Dechert", label: "Dechert" },
    { value: "Covington & Burling", label: "Covington & Burling" },
    { value: "Herbert Smith Freehills", label: "Herbert Smith Freehills" },
    { value: "Clifford Chance", label: "Clifford Chance" },
    { value: "Freshfields", label: "Freshfields" }
  ];

  const goodwinQuestions = [
    { value: "Why are you applying to Goodwin? (100 words)", label: "Why are you applying to Goodwin? (100 words)" },
    { value: "What is your personal motivation for seeking a career in corporate/commercial law? (100 words)", label: "What is your personal motivation for seeking a career in corporate/commercial law? (100 words)" },
    { value: "Provide an example of a change in society, the economy, or in a market sector which interests you and which you think could impact the legal sector. Discuss the impact it has had or could have. (350 words)", label: "Provide an example of a change in society, the economy, or in a market sector which interests you and which you think could impact the legal sector. Discuss the impact it has had or could have. (350 words)" },
    { value: "Describe a recent goal you worked towards and specify how you approached the achievement of that goal, including any lessons learned. (500 words)", label: "Describe a recent goal you worked towards and specify how you approached the achievement of that goal, including any lessons learned. (500 words)" },
    { value: "Identify a current commercial issue which has attracted your attention recently. Why do you consider it to be significant? Who are the key stakeholders in this situation and what are the implications for those concerned? (400 words)", label: "Identify a current commercial issue which has attracted your attention recently. Why do you consider it to be significant? Who are the key stakeholders in this situation and what are the implications for those concerned? (400 words)" },
    { value: "Please briefly summarise anything else that you would like to add which you think is relevant to your application. This can be positions of responsibility, extra-curricular activities and achievements or academic awards or scholarships. Please also include any information about which other firms you are applying to. (300 words)", label: "Please briefly summarise anything else that you would like to add which you think is relevant to your application. This can be positions of responsibility, extra-curricular activities and achievements or academic awards or scholarships. Please also include any information about which other firms you are applying to. (300 words)" }
  ];

  const jonesDayQuestions = [
    { value: "Cover letter", label: "Cover letter" },
    { value: "Please give a brief summary of any prizes, scholarships, positions of responsibility and any other noteworthy achievements gained at School, University, Law School or in employment (100)", label: "Please give a brief summary of any prizes, scholarships, positions of responsibility and any other noteworthy achievements gained at School, University, Law School or in employment (100)" },
    { value: "Please give a brief summary of any activities you've been involved in outside academic study or work over the last four years (100)", label: "Please give a brief summary of any activities you've been involved in outside academic study or work over the last four years (100)" }
  ];

  const whiteAndCaseQuestions = [
    { value: "Cover letter (max 3000 words)", label: "Cover letter (max 3000 words)" },
    { value: "Please give details of any interests and extra-curricular activities, including any positions of responsibility or achievements. (1500 words)", label: "Please give details of any interests and extra-curricular activities, including any positions of responsibility or achievements. (1500 words)" }
  ];  

  const sidleyAustinQuestions = [
    { value: "Why does a career in commercial law and specifically Sidley Austin interest you? (250 words max)", label: "Why does a career in commercial law and specifically Sidley Austin interest you? (250 words max)" },
    { value: "Please list any academic scholarships or prizes (200 words)", label: "Please list any academic scholarships or prizes (200 words)" },
    { value: "Detail your extra curricular activities and interests and positions of responsibility. Please state what you feel you have gained from them and how others have benefited from your involvement. (250 words max)", label: "Detail your extra curricular activities and interests and positions of responsibility. Please state what you feel you have gained from them and how others have benefited from your involvement. (250 words max)" },
    { value: "Describe a current commercial issue that has interested you and explain why it interested you? (250 words max)", label: "Describe a current commercial issue that has interested you and explain why it interested you? (250 words max)" },
    { value: "In your view which personal qualities make a successful lawyer? (250 words max)", label: "In your view which personal qualities make a successful lawyer? (250 words max)" }
  ];
  
  const dechertQuestions = [
    { value: "Please explain why you want to pursue a career as a commercial solicitor and why you would like to practise at Dechert (300)", label: "Please explain why you want to pursue a career as a commercial solicitor and why you would like to practise at Dechert (300)" },
    { value: "Dechert is frequently retained to work on the most challenging matters, and prides itself on its ability to deliver premium legal services and sound business judgment to its clients. In your opinion, other than the above, what are the three key reasons why our clients instruct us? (300)", label: "Dechert is frequently retained to work on the most challenging matters, and prides itself on its ability to deliver premium legal services and sound business judgment to its clients. In your opinion, other than the above, what are the three key reasons why our clients instruct us? (300)" },
    { value: "Please state your non-academic activities and interests indicating any positions of responsibility held and any particular achievements you would like to mention. (300)", label: "Please state your non-academic activities and interests indicating any positions of responsibility held and any particular achievements you would like to mention. (300)" },
    { value: "If applicable please state any additional information which you think is relevant to your application or which you think has not been covered adequately in this form. (300)", label: "If applicable please state any additional information which you think is relevant to your application or which you think has not been covered adequately in this form. (300)" }
  ];  

  const getQuestions = (firm) => {
    switch (firm) {
      case 'Goodwin':
        return goodwinQuestions;
      case 'Jones Day':
        return jonesDayQuestions;
      case 'White & Case':
        return whiteAndCaseQuestions;
      case 'Sidley Austin':
        return sidleyAustinQuestions
      case 'Dechert':
            return dechertQuestions;
      default:
        return [{ value: "Coming Soon", label: "Coming Soon" }];
    }
  };

  useEffect(() => {
    // Check if the email cookie exists
    const emailCookie = document.cookie.split('; ').find(row => row.startsWith('email='));
    if (!emailCookie) {
      setShowPopup(true);
    }
  }, []);

  useEffect(() => {
    const questions = getQuestions(selectedFirm.value);
    setSelectedQuestion(questions[0]);
  }, [selectedFirm]);

  const closePopup = () => {
    setShowPopup(false);
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
    setIsLoading(true);
    const startTime = Date.now();
    try {
      // Get device info
      const userAgent = navigator.userAgent;
      const screenSize = `${window.screen.width}x${window.screen.height}`;
      const emailCookie = document.cookie.split('; ').find(row => row.startsWith('email='));
      const email = emailCookie ? emailCookie.split('=')[1] : null;
  
      // Send application to your API
      const response = await fetch('http://localhost:8000/api/submit_application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          applicationText, 
          firm: selectedFirm.value, 
          question: selectedQuestion.value,
          email,  // Include the email in the submission
        }),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      console.log(data);
      setFeedback(data.feedback);
  
      // Record data in Supabase
      const { data: insertData, error } = await supabase
        .from('applications')
        .insert({
          firm: selectedFirm.value,
          question: selectedQuestion.value,
          application_text: applicationText,
          feedback: data.feedback,
          email,  // Include email here as well
          device: userAgent,
          screen_size: screenSize,
          timestamp: new Date().toISOString()
        });
  
      if (error) throw error;
  
      const endTime = Date.now();
      setResponseTime((endTime - startTime) / 1000); // Convert to seconds
  
    } catch (error) {
      console.error("Error:", error);
      setFeedback("Error: Unable to process your application. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };  

  const handleAdditionalInfoChange = (field, value) => {
    setAdditionalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateDraft = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/create_application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firm: selectedFirm.value,
          question: selectedQuestion.value,
          ...additionalInfo
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate draft');
      }

      const data = await response.json();
      setApplicationText(data.draft);
    } catch (error) {
      console.error('Error:', error);
      setFeedback("Error: Unable to generate draft. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="comparison-container">
      {showPopup && <EmailPopup onClose={closePopup} />}
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
            <button className="submit-button" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send for Review'}
            </button>
            <button className="submit-button" onClick={handleCreateDraft} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate a Draft'}
            </button>
          </div>
          <div className="title-card">
            <h3>Your Review</h3>
            <p className="subtext">
              {isLoading ? '⏳🙄👀' : 
               feedback ? `Your review took ${responseTime.toFixed(2)} seconds to generate` : 
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

export default Comparison;