import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsLeftRight,
  faBold,
  faItalic,
  faUnderline,
  faListUl,
  faListOl,
  faQuoteRight
} from '@fortawesome/free-solid-svg-icons';
import ApplicationInput from './ApplicationInput';
import './GenerateDraft.css';
import {
  getCurrentUser,
  getUserData,
  saveUserData,
  createApplicationDraft
} from '../utils/ApplicationReviewUtils';
import { firms, questions } from '../data/ApplicationReviewData';

function GenerateDraft() {
  const [leftWidth, setLeftWidth] = useState(50);
  const [draftText, setDraftText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState(firms[0]);
  const [selectedQuestion, setSelectedQuestion] = useState(questions[firms[0].value][0]);
  const [additionalInfo, setAdditionalInfo] = useState({
    keyReasons: '',
    relevantExperience: '',
    relevantInteraction: '',
    personalInfo: ''
  });
  const [user, setUser] = useState(null);

  const containerRef = useRef(null);
  const dividerRef = useRef(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      const loadUserData = async () => {
        const data = await getUserData(user.id);
        if (data) {
          setDraftText(data.application_text || "");
        }
      };
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const handleSave = async () => {
        try {
          await saveUserData(user.id, draftText);
        } catch (error) {
          console.error('Error saving user data:', error);
        }
      };
      handleSave();
    }
  }, [draftText, user]);

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

  const handleCreateDraft = async () => {
    if (!user) {
      alert('Please log in to generate a draft.');
      return;
    }

    const areAllFieldsFilled = Object.values(additionalInfo).every(field => field.trim() !== '');

    if (!areAllFieldsFilled) {
      alert('Please fill out all the additional information fields before generating a draft.');
      return;
    }

    setIsLoading(true);
    try {
      const draftData = {
        firm: selectedFirm.value,
        question: selectedQuestion.value,
        ...additionalInfo
      };
      const result = await createApplicationDraft(draftData);
      setDraftText(result.draft);
      alert(`Draft generated successfully. Credits used: ${result.usage.total_tokens}. Remaining credits: ${result.newBalance}`);
    } catch (error) {
      console.error('Error generating draft:', error);
      alert("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="comparison-container-draft">
      <div className="content-draft" ref={containerRef}>
        <div className="left-column-draft" style={{width: `${leftWidth}%`}}>
          <ApplicationInput
            applicationText={draftText}
            setApplicationText={setDraftText}
            selectedFirm={selectedFirm}
            setSelectedFirm={setSelectedFirm}
            selectedQuestion={selectedQuestion}
            setSelectedQuestion={setSelectedQuestion}
            firms={firms}
            getQuestions={(firm) => questions[firm]}
            additionalInfo={additionalInfo}
            onAdditionalInfoChange={setAdditionalInfo}
            wordCount={draftText.split(' ').length}
            inputType="expanded"
          />
        </div>
        <div className="divider-draft" ref={dividerRef} onMouseDown={handleMouseDown}>
          <div className="divider-line-draft top"></div>
          <div className="divider-handle-draft">
            <FontAwesomeIcon icon={faArrowsLeftRight} />
          </div>
          <div className="divider-line-draft bottom"></div>
        </div>
        <div className="right-column-draft" style={{width: `${100 - leftWidth}%`}}>
          <div className="rich-text-editor-draft">
            <textarea
              className="editor-content-draft"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="Your generated draft will appear here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenerateDraft;
