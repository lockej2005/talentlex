import React from 'react';
import Select from 'react-select';
import './ApplicationInput.css';

function ApplicationInput({
  applicationText,
  setApplicationText,
  selectedFirm,
  setSelectedFirm,
  selectedQuestion,
  setSelectedQuestion,
  firms,
  getQuestions,
  additionalInfo = {},
  onAdditionalInfoChange,
  wordCount,
  inputType
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

  const handleInputChange = (field, value) => {
    onAdditionalInfoChange(field, value);
  };

  const dropdownSection = (
    <div className="dropdown-container">
      {inputType === 'simple' && (
        <Select
          value={selectedFirm}
          onChange={(option) => {
            setSelectedFirm(option);
            const questions = getQuestions(option?.value || "");
            setSelectedQuestion(questions[0]);
          }}
          options={firms}
          styles={customStyles}
          isSearchable={false}
        />
      )}
      <Select
        value={selectedQuestion}
        onChange={setSelectedQuestion}
        options={selectedFirm ? getQuestions(selectedFirm.value) : []}
        styles={customStyles}
        isSearchable={false}
      />
    </div>
  );

  const renderSimpleInput = () => (
    <div className="application-container">
      <div className="title-card">
        <h3>Your Application</h3>
        <p>Select which firm you're applying to and the relevant question for a review.</p>
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
          {selectedFirm && selectedFirm.value === "Jones Day" ? (
            <>
              <div className="input-field">
                <label>Why law (paste your full 'why law' here):</label>
                <textarea
                  value={additionalInfo?.whyLaw || ""}
                  onChange={(e) => handleInputChange('whyLaw', e.target.value)}
                />
              </div>
              <div className="input-field">
                <label>Why Jones Day (interactions with the firm, key reasons for applying etc…):</label>
                <textarea
                  value={additionalInfo?.whyJonesDay || ""}
                  onChange={(e) => handleInputChange('whyJonesDay', e.target.value)}
                />
              </div>
              <div className="input-field">
                <label>Why you (any relevant personal reasons):</label>
                <textarea
                  value={additionalInfo?.whyYou || ""}
                  onChange={(e) => handleInputChange('whyYou', e.target.value)}
                />
              </div>
              <div className="input-field">
                <label>Any relevant experiences:</label>
                <textarea
                  value={additionalInfo?.relevantExperiences || ""}
                  onChange={(e) => handleInputChange('relevantExperiences', e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="input-field">
                <label>Key reason(s) for applying to firm:</label>
                <textarea
                  value={additionalInfo?.keyReasons || ""}
                  onChange={(e) => handleInputChange('keyReasons', e.target.value)}
                />
              </div>
              <div className="input-field">
                <label>Relevant experience:</label>
                <textarea
                  value={additionalInfo?.relevantExperience || ""}
                  onChange={(e) => handleInputChange('relevantExperience', e.target.value)}
                />
              </div>
              <div className="input-field">
                <label>Relevant interaction with firm (if any):</label>
                <textarea
                  value={additionalInfo?.relevantInteraction || ""}
                  onChange={(e) => handleInputChange('relevantInteraction', e.target.value)}
                />
              </div>
              <div className="input-field">
                <label>Any other personal information you'd like to include:</label>
                <textarea
                  value={additionalInfo?.personalInfo || ""}
                  onChange={(e) => handleInputChange('personalInfo', e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return inputType === 'simple' ? renderSimpleInput() : renderExpandedInput();
}

export default ApplicationInput;