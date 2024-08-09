import React, { useState } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './application.css';

function Application() {
  const [firm, setFirm] = useState('Firm B');
  const [question, setQuestion] = useState('');
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  const firmOptions = ['Firm A', 'Firm B', 'Firm C'];
  const questionOptions = ['Question 1', 'Question 2', 'Question 3'];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted:', { firm, question, editorState });
  };

  const toolbarOptions = {
    options: ['inline', 'blockType', 'list'],
    inline: {
      options: ['bold', 'italic', 'underline'],
    },
    blockType: {
      inDropdown: true,
      options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
      className: 'blockType-dropdown',
      dropdownClassName: 'blockType-dropdown-option',
    },
    list: {
      options: ['unordered', 'ordered'],
    },
  };

  return (
    <div className="application-container">
      <h2>Which application would you like to review?</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-row">
          <select value={firm} onChange={(e) => setFirm(e.target.value)}>
            {firmOptions.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
          <select value={question} onChange={(e) => setQuestion(e.target.value)}>
            <option value="">Select Question</option>
            {questionOptions.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
          <button type="submit">Next -></button>
        </div>
        <div className="editor-wrapper">
          <Editor
            editorState={editorState}
            onEditorStateChange={setEditorState}
            wrapperClassName="editor-wrapper"
            editorClassName="editor-main"
            toolbarClassName="editor-toolbar"
            toolbar={toolbarOptions}
          />
        </div>
      </form>
    </div>
  );
}

export default Application;