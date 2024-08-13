import React, { useState } from 'react';
import Select from 'react-select';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './ApplicationInput.css';

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

function ApplicationInput({ 
  applicationText, 
  setApplicationText, 
  selectedFirm, 
  setSelectedFirm, 
  selectedQuestion, 
  setSelectedQuestion, 
  firms, 
  getQuestions,
  additionalInfo,
  onAdditionalInfoChange
}) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleInputChange = (field, value) => {
    onAdditionalInfoChange(field, value);
  };

  return (
    <div className="application-container">
      <div className={`title-card ${isExpanded ? 'expanded' : ''}`}>
        <h3>Your Application</h3>
        <p>Select which firm you're applying to and the relevant question for a review. If you're feeling stuck, expand the input below and jot down some notes in the fields, then click 'generate draft'. Note: generating a draft only works if you select a question.</p>
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
        {isExpanded && (
          <div className="additional-fields">
            <div className="input-field">
              <label>Key reason(s) for applying to firm:</label>
              <textarea
                value={additionalInfo.keyReasons}
                onChange={(e) => handleInputChange('keyReasons', e.target.value)}
              />
            </div>
            <div className="input-field">
              <label>Relevant experience:</label>
              <textarea
                value={additionalInfo.relevantExperience}
                onChange={(e) => handleInputChange('relevantExperience', e.target.value)}
              />
            </div>
            <div className="input-field">
              <label>Relevant interaction with firm (if any):</label>
              <textarea
                value={additionalInfo.relevantInteraction}
                onChange={(e) => handleInputChange('relevantInteraction', e.target.value)}
              />
            </div>
            <div className="input-field">
              <label>Any other personal information you'd like to include:</label>
              <textarea
                value={additionalInfo.personalInfo}
                onChange={(e) => handleInputChange('personalInfo', e.target.value)}
              />
            </div>
          </div>
        )}
        <button className="expand-button" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>
      <div className="text-content">
        <EditableContent 
          value={applicationText} 
          onChange={(newText) => setApplicationText(newText)} 
        />
      </div>
    </div>
  );
}

export default ApplicationInput;