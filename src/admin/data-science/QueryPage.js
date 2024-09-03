import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { supabase } from '../../supabaseClient';
import { firms, questions } from '../../data/ApplicationReviewData';
import './QueryPage.css';

const QueryPage = () => {
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedTable, setSelectedTable] = useState({ value: 'applications', label: 'Applications' });
  const [queryResults, setQueryResults] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [uniqueCount, setUniqueCount] = useState(0);
  const [sortBy, setSortBy] = useState({ value: 'newest', label: 'Most Recent' });
  const [showUniqueOnly, setShowUniqueOnly] = useState(false);
  const [displayMode, setDisplayMode] = useState({ value: 'full', label: 'Full View' });
  const [expandedItem, setExpandedItem] = useState(null);

  const tables = [
    { value: 'applications', label: 'Applications' },
    { value: 'draft_generations', label: 'Draft Generations' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Most Recent' },
    { value: 'oldest', label: 'Oldest' }
  ];

  const displayOptions = [
    { value: 'full', label: 'Full View' },
    { value: 'compact', label: 'Compact View' }
  ];

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      border: 'none',
      borderRadius: '10px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '5px',
      marginBottom: '10px',
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

  useEffect(() => {
    fetchQueryResults();
  }, [selectedFirm, selectedQuestion, selectedTable, sortBy, showUniqueOnly]);

  const fetchQueryResults = async () => {
    let query = supabase
      .from(selectedTable.value)
      .select('*', { count: 'exact' });

    if (selectedFirm) {
      query = query.eq('firm', selectedFirm.value);
    }
    if (selectedQuestion) {
      query = query.eq('question', selectedQuestion.value);
    }

    if (sortBy.value === 'newest') {
      query = query.order('timestamp', { ascending: false });
    } else {
      query = query.order('timestamp', { ascending: true });
    }

    let { data, error, count } = await query;

    if (error) {
      console.error('Error fetching data:', error);
    } else {
      if (showUniqueOnly) {
        const uniqueData = data.filter((v, i, a) => a.findIndex(t => t.email === v.email) === i);
        setQueryResults(uniqueData);
        setResultCount(uniqueData.length);
      } else {
        setQueryResults(data);
        setResultCount(count);
      }

      const uniqueEmails = new Set(data.map(item => item.email));
      setUniqueCount(uniqueEmails.size);
    }
  };

  const toggleExpand = (id) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const renderResultItem = (item) => {
    const timestamp = new Date(item.timestamp).toLocaleString();
    const contentSnippet = (item.application_text || item.generated_draft || '').slice(0, 100) + '...';

    if (displayMode.value === 'compact') {
      return (
        <div key={item.id} className={`result-item-compact ${expandedItem === item.id ? 'expanded' : ''}`} onClick={() => toggleExpand(item.id)}>
          <div className="compact-content">
            <p><strong>Email:</strong> {item.email}</p>
            <p><strong>Timestamp:</strong> {timestamp}</p>
            <p><strong>Content:</strong> {contentSnippet}</p>
          </div>
          {expandedItem === item.id && (
            <div className="expanded-content">
              {renderFullContent(item)}
            </div>
          )}
        </div>
      );
    }

    return renderFullContent(item);
  };

  const renderFullContent = (item) => {
    const timestamp = new Date(item.timestamp).toLocaleString();

    if (selectedTable.value === 'applications') {
      return (
        <div className="result-item">
          <h4>Application {item.id} | {item.firm} | {item.question}</h4>
          <p><strong>Email:</strong> {item.email}</p>
          <p><strong>Application Text:</strong> {item.application_text}</p>
          <p><strong>Feedback:</strong> {item.feedback}</p>
          <p><strong>Timestamp:</strong> {timestamp}</p>
        </div>
      );
    } else {
      return (
        <div className="result-item">
          <h4>Draft Generation {item.id} | {item.firm} | {item.question}</h4>
          <p><strong>Email:</strong> {item.email}</p>
          <p><strong>Key Reasons:</strong> {item.key_reasons}</p>
          <p><strong>Relevant Experience:</strong> {item.relevant_experience}</p>
          <p><strong>Relevant Interaction:</strong> {item.relevant_interaction}</p>
          <p><strong>Personal Info:</strong> {item.personal_info}</p>
          <p><strong>Generated Draft:</strong> {item.generated_draft}</p>
          <p><strong>Timestamp:</strong> {timestamp}</p>
        </div>
      );
    }
  };

  return (
    <div className="query-page-admin">
      <h2>Query Data</h2>
      <div className="query-controls-admin">
        <Select
          value={selectedTable}
          onChange={setSelectedTable}
          options={tables}
          styles={customStyles}
          placeholder="Select table"
        />
        <Select
          value={selectedFirm}
          onChange={(option) => {
            setSelectedFirm(option);
            setSelectedQuestion(null);
          }}
          options={firms}
          styles={customStyles}
          placeholder="Select firm (optional)"
          isClearable
        />
        <Select
          value={selectedQuestion}
          onChange={setSelectedQuestion}
          options={selectedFirm ? questions[selectedFirm.value] : []}
          styles={customStyles}
          isDisabled={!selectedFirm}
          placeholder="Select question (optional)"
          isClearable
        />
        <Select
          value={sortBy}
          onChange={setSortBy}
          options={sortOptions}
          styles={customStyles}
          placeholder="Sort by"
        />
        <Select
          value={displayMode}
          onChange={(option) => {
            setDisplayMode(option);
            setExpandedItem(null); // Reset expanded item when changing display mode
          }}
          options={displayOptions}
          styles={customStyles}
          placeholder="Display mode"
        />
        <div className="filter-checkbox">
          <input
            type="checkbox"
            id="uniqueOnly"
            checked={showUniqueOnly}
            onChange={(e) => setShowUniqueOnly(e.target.checked)}
          />
          <label htmlFor="uniqueOnly">Show only unique entries</label>
        </div>
      </div>
      <div className="query-results-admin">
        <h3>Results (Total: {resultCount}, Unique: {uniqueCount})</h3>
        <div className={`results-list-admin ${displayMode.value === 'compact' ? 'compact-view' : ''}`}>
          {queryResults.map(renderResultItem)}
        </div>
      </div>
    </div>
  );
};

export default QueryPage;