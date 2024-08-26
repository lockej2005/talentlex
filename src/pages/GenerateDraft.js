import React, { useState, useEffect, useRef } from 'react';
import { Editor, EditorState, ContentState, RichUtils } from 'draft-js';
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
  const [editorState, setEditorState] = useState(() => 
    EditorState.createWithContent(ContentState.createFromText('Start writing...'))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState(firms[0]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [wordCount, setWordCount] = useState(2); // Initialize with the word count of "Start writing..."
  const containerRef = useRef(null);
  const dividerRef = useRef(null);
  const editorRef = useRef(null);
  const [additionalInfo, setAdditionalInfo] = useState({
    keyReasons: '',
    relevantExperience: '',
    relevantInteraction: '',
    personalInfo: '',
    whyLaw: '',
    whyJonesDay: '',
    whyYou: '',
    relevantExperiences: ''
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
          if (data && data.draft_text) {
            const contentState = ContentState.createFromText(data.draft_text);
            setEditorState(EditorState.createWithContent(contentState));
            setWordCount(countWords(data.draft_text));
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
      const contentState = editorState.getCurrentContent();
      saveUserData(user.id, { draft_text: contentState.getPlainText() }).catch(error => {
        console.error('Error saving user data:', error);
      });
    }
  }, [editorState, user]);

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

    let requiredFields;
    if (selectedFirm.value === "Jones Day") {
      requiredFields = ['whyLaw', 'whyJonesDay', 'whyYou', 'relevantExperiences'];
    } else {
      requiredFields = ['keyReasons', 'relevantExperience', 'relevantInteraction', 'personalInfo'];
    }

    const areAllFieldsFilled = requiredFields.every((field) => additionalInfo[field].trim() !== '');

    if (!areAllFieldsFilled) {
      alert('Please fill out all the required information fields before generating a draft.');
      return;
    } 

    setIsLoading(true);
    const startTime = Date.now();
    try {
      const result = await handleDraftCreation(
        user,
        selectedFirm,
        selectedQuestion,
        additionalInfo,
        (newDraftText) => {
          const contentState = ContentState.createFromText(newDraftText);
          setEditorState(EditorState.createWithContent(contentState));
          setWordCount(countWords(newDraftText));
        },
        setTotalTokens
      );
      const endTime = Date.now();
      setResponseTime((endTime - startTime) / 1000);
      alert(`Draft generated successfully. Credits used: ${result.cost}. Remaining credits: ${result.newBalance}`);
    } catch (error) {
      console.error('Error:', error);
      alert("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onEditorChange = (newEditorState) => {
    setEditorState(newEditorState);
    const currentContent = newEditorState.getCurrentContent().getPlainText();
    setWordCount(countWords(currentContent));
  };

  const applyInlineStyle = (style) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  const applyBlockType = (blockType) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  const countWords = (text) => {
    return text.trim().split(/\s+/).length;
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
            inputType="expanded"
            fullHeight={true}
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
              <button onClick={() => applyInlineStyle('BOLD')}><FontAwesomeIcon icon={faBold} /></button>
              <button onClick={() => applyInlineStyle('ITALIC')}><FontAwesomeIcon icon={faItalic} /></button>
              <button onClick={() => applyInlineStyle('UNDERLINE')}><FontAwesomeIcon icon={faUnderline} /></button>
              <button onClick={() => applyBlockType('unordered-list-item')}><FontAwesomeIcon icon={faListUl} /></button>
              <button onClick={() => applyBlockType('ordered-list-item')}><FontAwesomeIcon icon={faListOl} /></button>
              <button onClick={() => applyBlockType('blockquote')}><FontAwesomeIcon icon={faQuoteRight} /></button>
            </div>
            <div className="editor-container">
              <div className="editor-content-draft">
                <Editor
                  editorState={editorState}
                  onChange={onEditorChange}
                  ref={editorRef}
                />
              </div>
              <div className="word-count">
                Word count: {wordCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenerateDraft;
