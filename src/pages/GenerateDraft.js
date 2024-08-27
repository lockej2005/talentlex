import React, { useState, useEffect, useRef, useContext } from 'react';
import { Editor, EditorState, ContentState, RichUtils } from 'draft-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsLeftRight, faBold, faItalic, faUnderline, faListUl, faListOl, faQuoteRight } from '@fortawesome/free-solid-svg-icons';
import ApplicationInput from './ApplicationInput';
import './GenerateDraft.css';
import { UserInputContext } from '../context/UserInputContext';
import {
  getCurrentUser,
  handleDraftCreation
} from '../utils/ApplicationReviewUtils';
import { firms, questions } from '../data/ApplicationReviewData';

const countWords = (text) => {
  return text.trim().split(/\s+/).length;
};

function GenerateDraft() {
  const { draftText, setDraftText, additionalInfo, setAdditionalInfo, selectedFirm, setSelectedFirm } = useContext(UserInputContext);

  const [editorState, setEditorState] = useState(() => 
    EditorState.createWithContent(ContentState.createFromText(draftText || 'Start writing...'))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [wordCount, setWordCount] = useState(() => countWords(draftText || 'Start writing...'));
  const [leftWidth, setLeftWidth] = useState(50);
  const containerRef = useRef(null);
  const dividerRef = useRef(null);
  const editorRef = useRef(null);
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

    // Set default firm to Goodwin
    const defaultFirm = firms.find(firm => firm.value === "Goodwin") || firms[0];
    setSelectedFirm(defaultFirm);
  }, []);

  useEffect(() => {
    if (selectedFirm) {
      const firmQuestions = getQuestions(selectedFirm.value);
      // Set default question to "Why are you applying to Goodwin?"
      const defaultQuestion = firmQuestions.find(q => q.value === "Why are you applying to Goodwin?") || firmQuestions[0];
      setSelectedQuestion(defaultQuestion);
    }
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

  const handleAdditionalInfoChange = (field, value) => {
    setAdditionalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateDraft = async () => {
    if (!user) {
      alert('Please log in to generate a draft.');
      return;
    }

    let requiredFields;
    if (selectedFirm?.value === "Jones Day") {
      requiredFields = ['whyLaw', 'whyJonesDay', 'whyYou', 'relevantExperiences'];
    } else {
      requiredFields = ['keyReasons', 'relevantExperience', 'relevantInteraction', 'personalInfo'];
    }

    const areAllFieldsFilled = requiredFields.every((field) => additionalInfo[field]?.trim() !== '');

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
          const updatedDraftText = newDraftText;
          
          const contentState = ContentState.createFromText(updatedDraftText);
          setEditorState(EditorState.createWithContent(contentState));
          setDraftText(updatedDraftText);
          setWordCount(countWords(updatedDraftText));
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
    setDraftText(currentContent);
    setWordCount(countWords(currentContent));
  };

  const applyInlineStyle = (style) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  const applyBlockType = (blockType) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  return (
    <div className="comparison-container-draft">
      <div className="content-draft" ref={containerRef}>
        <div className="left-column-draft" style={{ width: `${leftWidth}%` }}>
          <ApplicationInput
            applicationText={draftText}
            setApplicationText={setDraftText}
            selectedFirm={selectedFirm}
            setSelectedFirm={setSelectedFirm}
            selectedQuestion={selectedQuestion}
            setSelectedQuestion={setSelectedQuestion}
            firms={firms}
            getQuestions={getQuestions}
            additionalInfo={additionalInfo}
            onAdditionalInfoChange={handleAdditionalInfoChange}
            wordCount={wordCount}
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
        <div className="right-column-draft" style={{ width: `${100 - leftWidth}%` }}>
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