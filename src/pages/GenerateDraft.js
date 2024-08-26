import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsLeftRight, faBold, faItalic, faUnderline, faListUl, faListOl, faQuoteRight } from '@fortawesome/free-solid-svg-icons';
import ApplicationInput from './ApplicationInput';
import './GenerateDraft.css';
import {
  getCurrentUser,
  getUserData,
  saveUserData,
  handleDraftCreation
} from '../utils/ApplicationReviewUtils';
import { firms, questions } from '../data/ApplicationReviewData';

function GenerateDraft() {
  const [leftWidth, setLeftWidth] = useState(50);
  const [draftText, setDraftText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState(firms[0]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const containerRef = useRef(null);
  const dividerRef = useRef(null);
  const textareaRef = useRef(null);
  const [additionalInfo, setAdditionalInfo] = useState({
    keyReasons: '',
    relevantExperience: '',
    relevantInteraction: '',
    personalInfo: ''
  });
  const [user, setUser] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);

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
    const loadUserData = async () => {
      if (user) {
        try {
          const data = await getUserData(user.id);
          if (data) {
            setDraftText(data.draft_text || "");
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
      saveUserData(user.id, { draft_text: draftText }).catch(error => {
        console.error('Error saving user data:', error);
      });
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

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleAdditionalInfoChange = (field, value) => {
    setAdditionalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateDraft = async () => {
    if (!user) {
      alert('Please log in to generate a draft.');
      return;
    }

    const areAllFieldsFilled = Object.values(additionalInfo).every(field => field.trim() !== '') && selectedFirm && selectedQuestion;

    if (!areAllFieldsFilled) {
      alert('Please fill out all fields and make sure you\'ve selected a firm and a question.');
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();
    try {
      const draftData = {
        firm: selectedFirm.value,
        question: selectedQuestion.label,  // Assuming .label is the text to be sent
        ...additionalInfo
      };

      const result = await createApplicationDraft(draftData);
      const endTime = Date.now();
      setResponseTime((endTime - startTime) / 1000);
      setDraftText(result.draft);
      alert(`Draft generated successfully. Credits used: ${result.usage.total_tokens}. Remaining credits: ${result.newBalance}`);
    } catch (error) {
      console.error('Error:', error);
      alert("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleEditorChange = (e) => {
    setDraftText(e.target.value);
  };

  const applyStyle = (style) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = draftText.substring(start, end);
    let newText = draftText;

    switch (style) {
      case 'bold':
        newText = draftText.substring(0, start) + `**${selectedText}**` + draftText.substring(end);
        break;
      case 'italic':
        newText = draftText.substring(0, start) + `*${selectedText}*` + draftText.substring(end);
        break;
      case 'underline':
        newText = draftText.substring(0, start) + `__${selectedText}__` + draftText.substring(end);
        break;
      case 'insertUnorderedList':
        newText = draftText.substring(0, start) + `\n- ${selectedText}` + draftText.substring(end);
        break;
      case 'insertOrderedList':
        newText = draftText.substring(0, start) + `\n1. ${selectedText}` + draftText.substring(end);
        break;
      case 'formatBlock':
        newText = draftText.substring(0, start) + `\n> ${selectedText}` + draftText.substring(end);
        break;
      default:
        break;
    }

    setDraftText(newText);
    textarea.focus();
    textarea.setSelectionRange(start, end + 4); // +4 for the added markdown characters
  };

  return (
    <div className="comparison-container-draft">
      <div className="content-draft" ref={containerRef}>
        <div className="left-column-draft" style={{width: `${leftWidth}%`}}>
          <ApplicationInput
            selectedFirm={selectedFirm}
            setSelectedFirm={setSelectedFirm}
            selectedQuestion={selectedQuestion}
            setSelectedQuestion={setSelectedQuestion}
            firms={firms}
            getQuestions={getQuestions}
            additionalInfo={additionalInfo}
            onAdditionalInfoChange={handleAdditionalInfoChange}
            inputType="expanded" // Specify the expanded input type
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
          <div className="button-container-draft">
            <button className="submit-button-draft" onClick={handleCreateDraft} disabled={isLoading || !user}>
              {isLoading ? 'Generating...' : 'Generate Draft'}
            </button>
          </div>
          <div className="rich-text-editor-draft">
            <div className="editor-toolbar-draft">
              <button onClick={() => applyStyle('bold')}><FontAwesomeIcon icon={faBold} /></button>
              <button onClick={() => applyStyle('italic')}><FontAwesomeIcon icon={faItalic} /></button>
              <button onClick={() => applyStyle('underline')}><FontAwesomeIcon icon={faUnderline} /></button>
              <button onClick={() => applyStyle('insertUnorderedList')}><FontAwesomeIcon icon={faListUl} /></button>
              <button onClick={() => applyStyle('insertOrderedList')}><FontAwesomeIcon icon={faListOl} /></button>
              <button onClick={() => applyStyle('formatBlock')}><FontAwesomeIcon icon={faQuoteRight} /></button>
            </div>
            <textarea
              ref={textareaRef}
              className="editor-content-draft"
              value={draftText}
              onChange={handleEditorChange}
              placeholder="Your generated draft will appear here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenerateDraft;
