import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Editor, EditorState, ContentState, RichUtils, SelectionState } from 'draft-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsLeftRight, faBold, faItalic, faUnderline, faListUl, faListOl, faQuoteRight } from '@fortawesome/free-solid-svg-icons';
import ApplicationInput from './ApplicationInput';
import './GenerateDraft.css';
import { UserInputContext } from '../context/UserInputContext';
import { getCurrentUser, handleDraftCreation } from '../utils/ApplicationReviewUtils';
import { firms, questions } from '../data/ApplicationReviewData';
import { supabase } from '../supabaseClient';

const countWords = (text) => {
  return text.trim().split(/\s+/).length;
};

function GenerateDraft({ firmId, selectedFirm, onDraftChange }) {
  const { 
    draftText, setDraftText, 
    additionalInfo, setAdditionalInfo, 
    selectedQuestion, setSelectedQuestion
  } = useContext(UserInputContext);

  const [editorState, setEditorState] = useState(() => 
    EditorState.createWithContent(ContentState.createFromText(draftText || ''))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(null);
  const [wordCount, setWordCount] = useState(() => countWords(draftText || ''));
  const [leftWidth, setLeftWidth] = useState(50);
  const [user, setUser] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [isEdited, setIsEdited] = useState(false);
  const [firmQuestions, setFirmQuestions] = useState([]);

  const containerRef = useRef(null);
  const dividerRef = useRef(null);
  const editorRef = useRef(null);
  const editorContainerRef = useRef(null);

  const getQuestions = useCallback((firm) => {
    return questions[firm] || [];
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedFirm) {
      const firmSpecificQuestions = getQuestions(selectedFirm.value);
      setFirmQuestions(firmSpecificQuestions);
      if (firmSpecificQuestions.length > 0 && (!selectedQuestion || selectedQuestion.firm !== selectedFirm.value)) {
        setSelectedQuestion(firmSpecificQuestions[0]);
      }
    }
  }, [selectedFirm, getQuestions, setSelectedQuestion]);

  useEffect(() => {
    const loadSavedDraft = async () => {
      if (user && selectedFirm && selectedQuestion) {
        setIsLoading(true);
        try {
          const { data: savedDraft, error } = await supabase
            .from('drafts_generations_vector')
            .select('*')
            .eq('user_id', user.id)
            .eq('firm_id', selectedFirm.value)
            .eq('question', selectedQuestion.value)
            .single();

          if (error && error.code !== 'PGRST116') throw error;

          if (savedDraft) {
            setDraftText(savedDraft.generated_draft || '');
            setEditorState(EditorState.createWithContent(ContentState.createFromText(savedDraft.generated_draft || '')));
            setWordCount(countWords(savedDraft.generated_draft || ''));
            setAdditionalInfo({
              note_1: savedDraft.note_1 || '',
              note_2: savedDraft.note_2 || '',
              note_3: savedDraft.note_3 || '',
              note_4: savedDraft.note_4 || '',
            });
          } else {
            resetDraft();
          }
        } catch (error) {
          console.error('Error loading saved draft:', error);
          resetDraft();
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSavedDraft();
  }, [user, selectedFirm, selectedQuestion, setDraftText, setAdditionalInfo]);

  const resetDraft = useCallback(() => {
    setDraftText('');
    setEditorState(EditorState.createEmpty());
    setWordCount(0);
    setAdditionalInfo({
      note_1: '',
      note_2: '',
      note_3: '',
      note_4: '',
    });
  }, [setDraftText, setAdditionalInfo]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      setLeftWidth(Math.min(Math.max(newLeftWidth, 20), 80));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleAdditionalInfoChange = useCallback((field, value) => {
    setAdditionalInfo(prev => ({ ...prev, [field]: value }));
    setIsEdited(true);
  }, [setAdditionalInfo]);

  const handleCreateDraft = useCallback(async () => {
    if (!user) {
      alert('Please log in to generate a draft.');
      return;
    }

    let requiredFields = ['note_1', 'note_2', 'note_3', 'note_4'];

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
          const contentState = ContentState.createFromText(newDraftText);
          setEditorState(EditorState.createWithContent(contentState));
          setDraftText(newDraftText);
          setWordCount(countWords(newDraftText));
          setIsEdited(true);
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
  }, [user, selectedFirm, selectedQuestion, additionalInfo, setDraftText, setEditorState]);

  const onEditorChange = useCallback((newEditorState) => {
    setEditorState(newEditorState);
    const currentContent = newEditorState.getCurrentContent().getPlainText();
    setDraftText(currentContent);
    setWordCount(countWords(currentContent));
    setIsEdited(true);
  }, [setDraftText]);

  const applyInlineStyle = useCallback((style) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  }, [editorState]);

  const applyBlockType = useCallback((blockType) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  }, [editorState]);

  const handleEditorClick = useCallback((e) => {
    const editorContainer = editorContainerRef.current;
    if (!editorContainer) return;

    const { top, left } = editorContainer.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    const contentState = editorState.getCurrentContent();
    const blockMap = contentState.getBlockMap();
    let blockKey = blockMap.first().getKey();

    blockMap.forEach((block) => {
      const blockNode = document.querySelector(`[data-offset-key="${block.getKey()}-0-0"]`);
      if (blockNode) {
        const { top: blockTop, height: blockHeight } = blockNode.getBoundingClientRect();
        if (y >= blockTop && y <= blockTop + blockHeight) {
          blockKey = block.getKey();
        }
      }
    });

    const selection = SelectionState.createEmpty(blockKey);
    const newSelection = selection.merge({
      anchorOffset: 0,
      focusOffset: 0,
    });

    const newEditorState = EditorState.forceSelection(editorState, newSelection);
    setEditorState(newEditorState);
    editorRef.current.focus();
  }, [editorState]);

  const handleQuestionChange = useCallback((newQuestion) => {
    setSelectedQuestion(newQuestion);
    resetDraft();
  }, [setSelectedQuestion, resetDraft]);

  useEffect(() => {
    if (isEdited && user && selectedFirm && selectedQuestion) {
      const draftData = {
        user_id: user.id,
        firm_id: selectedFirm.value,
        question: selectedQuestion.value,
        note_1: additionalInfo.note_1 || '',
        note_2: additionalInfo.note_2 || '',
        note_3: additionalInfo.note_3 || '',
        note_4: additionalInfo.note_4 || '',
        generated_draft: draftText,
      };
      onDraftChange(draftData);
    }
  }, [isEdited, user, draftText, selectedFirm, selectedQuestion, additionalInfo, onDraftChange]);

  return (
    <div className="comparison-container-draft">
      <div className="content-draft" ref={containerRef}>
        <div className="left-column-draft" style={{ width: `${leftWidth}%` }}>
          <ApplicationInput
            applicationText={draftText}
            setApplicationText={setDraftText}
            selectedFirm={selectedFirm}
            selectedQuestion={selectedQuestion}
            setSelectedQuestion={handleQuestionChange}
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
            <div className="editor-container" ref={editorContainerRef} onClick={handleEditorClick}>
              <div className="editor-content-draft">
                <Editor
                  editorState={editorState}
                  onChange={onEditorChange}
                  ref={editorRef}
                />
              </div>
              <div className="word-count-draft">
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