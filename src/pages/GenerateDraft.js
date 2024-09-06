import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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

function GenerateDraft() {
  const { id: draftId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    draftText, setDraftText, 
    additionalInfo, setAdditionalInfo, 
    selectedFirm, setSelectedFirm,
    selectedQuestion, setSelectedQuestion
  } = useContext(UserInputContext);

  const [editorState, setEditorState] = useState(() => 
    EditorState.createWithContent(ContentState.createFromText(draftText || ''))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(null);
  const [wordCount, setWordCount] = useState(() => countWords(draftText || ''));
  const [leftWidth, setLeftWidth] = useState(50);
  const containerRef = useRef(null);
  const dividerRef = useRef(null);
  const editorRef = useRef(null);
  const editorContainerRef = useRef(null);
  const [user, setUser] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [showSaveToolbar, setShowSaveToolbar] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [isEdited, setIsEdited] = useState(false);

  const getQuestions = (firm) => {
    return questions[firm] || [{ value: "Coming Soon", label: "Coming Soon" }];
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };

    fetchCurrentUser();

    if (!selectedFirm) {
      const defaultFirm = firms.find(firm => firm.value === "Goodwin") || firms[0];
      setSelectedFirm(defaultFirm);
    }
  }, [selectedFirm, setSelectedFirm]);

  useEffect(() => {
    if (selectedFirm && !selectedQuestion) {
      const firmQuestions = getQuestions(selectedFirm.value);
      const defaultQuestion = firmQuestions.find(q => q.value === "Why are you applying to Goodwin?") || firmQuestions[0];
      setSelectedQuestion(defaultQuestion);
    }
  }, [selectedFirm, selectedQuestion, setSelectedQuestion]);

  useEffect(() => {
    const loadSavedDraft = async () => {
      if (draftId) {
        setIsLoading(true);
        try {
          const { data: savedDraft, error } = await supabase
            .from('saved_drafts')
            .select('*')
            .eq('id', draftId)
            .single();

          if (error) throw error;

          if (savedDraft) {
            setDraftText(savedDraft.draft || '');
            setEditorState(EditorState.createWithContent(ContentState.createFromText(savedDraft.draft || '')));
            setWordCount(countWords(savedDraft.draft || ''));
            setDraftTitle(savedDraft.title || '');

            const selectedFirm = firms.find(f => f.value === savedDraft.firm);
            if (selectedFirm) {
              setSelectedFirm(selectedFirm);
              const firmQuestions = getQuestions(selectedFirm.value);
              const selectedQuestion = firmQuestions.find(q => q.value === savedDraft.question);
              if (selectedQuestion) {
                setSelectedQuestion(selectedQuestion);
              }
            }

            setAdditionalInfo({
              whyLaw: savedDraft.answer_1 || '',
              whyJonesDay: savedDraft.answer_2 || '',
              whyYou: savedDraft.answer_3 || '',
              relevantExperiences: savedDraft.answer_4 || '',
              keyReasons: savedDraft.answer_1 || '',
              relevantExperience: savedDraft.answer_2 || '',
              relevantInteraction: savedDraft.answer_3 || '',
              personalInfo: savedDraft.answer_4 || ''
            });
          }
        } catch (error) {
          console.error('Error loading saved draft:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        const defaultFirm = firms[0];
        setSelectedFirm(defaultFirm);
        setDraftTitle(defaultFirm.label);
        setDraftText('');
        setEditorState(EditorState.createEmpty());
        setWordCount(0);
        setSelectedQuestion(null);
        setAdditionalInfo({});
      }
    };

    loadSavedDraft();
  }, [draftId, setDraftText, setSelectedFirm, setSelectedQuestion, setAdditionalInfo]);

  useEffect(() => {
    if (location.pathname === '/generate-draft') {
      setDraftText('');
      setEditorState(EditorState.createEmpty());
      setWordCount(0);
      setDraftTitle('');
      setSelectedFirm(null);
      setSelectedQuestion(null);
      setAdditionalInfo({});
    }
  }, [location.pathname, setDraftText, setEditorState, setWordCount, setDraftTitle, setSelectedFirm, setSelectedQuestion, setAdditionalInfo]);

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
    setIsEdited(true);
    setShowSaveToolbar(true);
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
          setIsEdited(true);
          setShowSaveToolbar(true);
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

  const handleSaveDraft = async () => {
    try {
      const draftData = {
        user_id: user.id,
        title: draftTitle,
        draft: draftText,
        firm: selectedFirm?.value || '',
        question: selectedQuestion?.value || '',
        answer_1: selectedFirm?.value === "Jones Day" ? additionalInfo.whyLaw : additionalInfo.keyReasons || '',
        answer_2: selectedFirm?.value === "Jones Day" ? additionalInfo.whyJonesDay : additionalInfo.relevantExperience || '',
        answer_3: selectedFirm?.value === "Jones Day" ? additionalInfo.whyYou : additionalInfo.relevantInteraction || '',
        answer_4: selectedFirm?.value === "Jones Day" ? additionalInfo.relevantExperiences : additionalInfo.personalInfo || ''
      };
  
      if (draftId) {
        const { error } = await supabase
          .from('saved_drafts')
          .update(draftData)
          .eq('id', draftId);
  
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('saved_drafts')
          .insert(draftData)
          .select();
  
        if (error) throw error;
        if (data && data[0]) {
          // If this was a new draft, update the URL with the new draft ID
          navigate(`/generate-draft/${data[0].id}`, { replace: true });
        }
      }
  
      alert('Draft saved successfully!');
      setShowSaveToolbar(false);
      setIsEdited(false);
      // We're not navigating away after saving
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    }
  };

  const onEditorChange = (newEditorState) => {
    setEditorState(newEditorState);
    const currentContent = newEditorState.getCurrentContent().getPlainText();
    setDraftText(currentContent);
    setWordCount(countWords(currentContent));
    if (!isEdited) {
      setIsEdited(true);
      setShowSaveToolbar(true);
    }
  };

  const applyInlineStyle = (style) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  const applyBlockType = (blockType) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  const handleEditorClick = (e) => {
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
  };

  return (
    <div className="comparison-container-draft">
      <div className="save-toolbar">
        <div className="draft-title">{draftTitle}</div>
        <button onClick={handleSaveDraft}>Save Draft</button>
      </div>
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