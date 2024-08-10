import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsLeftRight } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import Select from 'react-select';
import { loadStripe } from '@stripe/stripe-js';
import { createClient } from '@supabase/supabase-js';
import './comparison.css';

// Initialize Stripe
const stripePromise = loadStripe('pk_live_51P4eASP1v3Dm1cKPvctekur3arCo5DAO0Bdgk9cHm1V4i3MPJWnFTS94UsfF45bUUlilPdShd2TdpLNht3IZBhXI00lZTdbwPr');

// Initialize Supabase
const supabaseUrl = 'https://atbphpeswwgqvwlbplko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YnBocGVzd3dncXZ3bGJwbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMyNzY2MDksImV4cCI6MjAzODg1MjYwOX0.Imv3PmtGs9pGt6MvrvscR6cuv6WWCXKsSvwTZGjF4xU';
const supabase = createClient(supabaseUrl, supabaseKey);

function EditableContent({ value, onChange }) {
  return (
    <textarea
      className="editable-content"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        resize: 'none',
        backgroundColor: 'transparent',
        color: 'inherit',
        font: 'inherit',
        padding: '10px',
        boxSizing: 'border-box',
      }}
    />
  );
}

function Comparison() {
  const [leftWidth, setLeftWidth] = useState(50);
  const [applicationText, setApplicationText] = useState("Enter your application here.");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState({ value: "Goodwin", label: "Goodwin" });
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const containerRef = useRef(null);
  const dividerRef = useRef(null);

  const firms = [
    { value: "Goodwin", label: "Goodwin" },
    { value: "Jones Day", label: "Jones Day" },
    { value: "White & Case", label: "White & Case" },
    { value: "Dechert", label: "Dechert" },
    { value: "Covington & Burling", label: "Covington & Burling" },
    { value: "Herbert Smith Freehills", label: "Herbert Smith Freehills" },
    { value: "Clifford Chance", label: "Clifford Chance" },
    { value: "Freshfields", label: "Freshfields" },
    { value: "Sidley Austin", label: "Sidley Austin" }
  ];

  const goodwinQuestions = [
    { value: "Why are you applying to Goodwin? (100 words)", label: "Why are you applying to Goodwin? (100 words)" },
    { value: "What is your personal motivation for seeking a career in corporate/commercial law? (100 words)", label: "What is your personal motivation for seeking a career in corporate/commercial law? (100 words)" },
    { value: "Provide an example of a change in society, the economy, or in a market sector which interests you and which you think could impact the legal sector. Discuss the impact it has had or could have. (350 words)", label: "Provide an example of a change in society, the economy, or in a market sector which interests you and which you think could impact the legal sector. Discuss the impact it has had or could have. (350 words)" },
    { value: "Describe a recent goal you worked towards and specify how you approached the achievement of that goal, including any lessons learned. (500 words)", label: "Describe a recent goal you worked towards and specify how you approached the achievement of that goal, including any lessons learned. (500 words)" },
    { value: "Identify a current commercial issue which has attracted your attention recently. Why do you consider it to be significant? Who are the key stakeholders in this situation and what are the implications for those concerned? (400 words)", label: "Identify a current commercial issue which has attracted your attention recently. Why do you consider it to be significant? Who are the key stakeholders in this situation and what are the implications for those concerned? (400 words)" },
    { value: "Please briefly summarise anything else that you would like to add which you think is relevant to your application. This can be positions of responsibility, extra-curricular activities and achievements or academic awards or scholarships. Please also include any information about which other firms you are applying to. (300 words)", label: "Please briefly summarise anything else that you would like to add which you think is relevant to your application. This can be positions of responsibility, extra-curricular activities and achievements or academic awards or scholarships. Please also include any information about which other firms you are applying to. (300 words)" }
  ];

  const getQuestions = (firm) => {
    switch (firm) {
      case 'Goodwin':
        return goodwinQuestions;
      case 'Jones Day':
        return [{ value: "Cover letter (300 words)", label: "Cover letter (300 words)" }];
      case 'White & Case':
        return [{ value: "Cover letter", label: "Cover letter" }];
      default:
        return [{ value: "Coming Soon", label: "Coming Soon" }];
    }
  };

  useEffect(() => {
    const questions = getQuestions(selectedFirm.value);
    setSelectedQuestion(questions[0]);
  }, [selectedFirm]);

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
    try {
      // Get device info
      const userAgent = navigator.userAgent;
      const screenSize = `${window.screen.width}x${window.screen.height}`;

      // Send application to your API
      const response = await fetch('http://localhost:8000/api/submit_application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          applicationText, 
          firm: selectedFirm.value, 
          question: selectedQuestion.value 
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
          device: userAgent,
          screen_size: screenSize,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.error("Error:", error);
      setFeedback("Error: Unable to process your application. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonation = async () => {
    try {
      // Create checkout session
      const response = await fetch('http://localhost:8000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // You can add any additional data here if needed
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (error) {
        console.error('Error:', error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      border: 'none',
      borderRadius: '10px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '5px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#276D8B' : 'white',
      color: state.isSelected ? 'white' : '#276D8B',
      '&:hover': {
        backgroundColor: '#e6f3f7',
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#276D8B',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '10px',
      overflow: 'hidden',
      marginTop: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    }),
  };

  return (
    <div className="comparison-container">
      <div className="header">
        <h2>Law App Review AI</h2>
      </div>
      <div className="content" ref={containerRef}>
        <div className="left-column" style={{width: `${leftWidth}%`}}>
          <div className="button-container">
            <button className="submit-button" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
          <div className="title-card">
            <h3>Your Application</h3>
            <div className="dropdown-container">
              <Select
                value={selectedFirm}
                onChange={(option) => {
                  setSelectedFirm(option);
                  const questions = getQuestions(option.value);
                  setSelectedQuestion(questions[0]);
                }}
                options={firms}
                styles={customStyles}
                isSearchable={false}
              />
              <Select
                value={selectedQuestion}
                onChange={setSelectedQuestion}
                options={getQuestions(selectedFirm.value)}
                styles={customStyles}
                isSearchable={false}
              />
            </div>
          </div>
          <div className="text-content">
            <EditableContent 
              value={applicationText} 
              onChange={(newText) => setApplicationText(newText)} 
            />
          </div>
        </div>
        <div className="divider" ref={dividerRef} onMouseDown={handleMouseDown}>
          <div className="divider-line top"></div>
          <div className="divider-handle">
            <FontAwesomeIcon icon={faArrowsLeftRight} />
          </div>
          <div className="divider-line bottom"></div>
        </div>
        <div className="right-column" style={{width: `${100 - leftWidth}%`}}>
          <div className="title-card">
            <h3>Your Feedback</h3>
            <p className="subtext">AI-Generated Feedback</p>
          </div>
          <div className="text-content">
            {feedback ? (
              <ReactMarkdown>{feedback}</ReactMarkdown>
            ) : (
              <p>Submit your application to receive feedback.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Comparison;