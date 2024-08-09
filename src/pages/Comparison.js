import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsLeftRight } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import './comparison.css';

function EditableContent({ value, onChange }) {
  const handleInput = (e) => {
    onChange(e.target.innerText);
  };

  return (
    <div
      className="editable-content"
      contentEditable
      onInput={handleInput}
      dangerouslySetInnerHTML={{ __html: value.replace(/\n/g, '<br>') }}
    />
  );
}

function Comparison() {
  const [leftWidth, setLeftWidth] = useState(50);
  const [applicationText, setApplicationText] = useState("Enter your application here.");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);
  const dividerRef = useRef(null);

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
      const response = await fetch('http://localhost:5000/submit_application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationText }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setFeedback(data.feedback);
    } catch (error) {
      console.error("Error submitting application:", error);
      setFeedback("Error: Unable to get feedback. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="comparison-container">
      <div className="header">
        <h2>TalentLex AI</h2>
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
            <p className="subtext">Goodwin | Why Goodwin? (100 Words)</p>
          </div>
          <div className="text-content">
            <EditableContent value={applicationText} onChange={setApplicationText} />
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