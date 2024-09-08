import React from 'react';
import Select from 'react-select';
import './ApplicationInput.css';

function ApplicationInput({
  applicationText,
  setApplicationText,
  selectedQuestion,
  setSelectedQuestion,
  questions,
  wordCount,
  inputType,
  onQuestionChange
}) {
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

  const handleQuestionChange = (newQuestion) => {
    setSelectedQuestion(newQuestion);
    if (onQuestionChange) {
      onQuestionChange(newQuestion);
    }
  };

  const dropdownSection = (
    <div className="dropdown-container">
      <Select
        value={selectedQuestion}
        onChange={handleQuestionChange}
        options={questions}
        styles={customStyles}
        isSearchable={false}
      />
    </div>
  );

  const renderSimpleInput = () => (
    <div className="application-container">
      <div className="title-card">
        <h3>Your Application</h3>
        <p>Select the relevant question for a review.</p>
        {dropdownSection}
      </div>
      <div className="text-content">
        <div className="editable-content-container">
          <textarea
            className="editable-content"
            value={applicationText}
            onChange={(e) => setApplicationText(e.target.value)}
            placeholder="Enter your application here..."
          />
          <div className="word-count">{wordCount} words</div>
        </div>
      </div>
    </div>
  );

  const renderExpandedInput = () => (
    <div className="application-container">
      <div className="title-card expanded">
        <h3>Additional Information</h3>
        <p>Please provide the following details to help generate your draft.</p>
        {dropdownSection}
        <div className="additional-fields">
          <div className="input-field">
            <label>Key reason(s) for applying to firm:</label>
            <textarea
              value={applicationText}
              onChange={(e) => setApplicationText(e.target.value)}
            />
          </div>
          <div className="input-field">
            <label>Relevant experience:</label>
            <textarea />
          </div>
          <div className="input-field">
            <label>Relevant interaction with firm (if any):</label>
            <textarea />
          </div>
          <div className="input-field">
            <label>Any other personal information you'd like to include:</label>
            <textarea />
          </div>
        </div>
      </div>
    </div>
  );

  return inputType === 'simple' ? renderSimpleInput() : renderExpandedInput();
}

export default ApplicationInput;