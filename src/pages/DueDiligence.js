import React, { useState } from 'react';
import axios from 'axios';
import { ArrowUp, ExternalLink } from 'lucide-react';
import './DueDiligence.css';

const DueDiligence = () => {
  const [backgroundInfo, setBackgroundInfo] = useState('');
  const [facts, setFacts] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [searchQueries, setSearchQueries] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setSearchQueries(null);
    setSearchResults(null);

    try {
      const response = await axios.post('/api/process_prompt', {
        prompt: `Background Information: ${backgroundInfo}\n\nFacts: ${facts}`
      });

      if (response.data && response.data.due_diligence_points) {
        setResults(response.data.due_diligence_points);
        setSearchQueries(response.data.search_queries);
        setSearchResults(response.data.scraped_contents);
      } else if (response.data && response.data.error) {
        throw new Error(response.data.error);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setError(error.message || 'An error occurred while processing your request. Please try again.');
      if (error.response && error.response.data && error.response.data.raw_content) {
        console.log('Raw API response:', error.response.data.raw_content);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="due-diligence-container">
      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-group">
          <div className="input-fields">
            <textarea
              value={backgroundInfo}
              onChange={(e) => setBackgroundInfo(e.target.value)}
              placeholder="Input any background information here"
              className="background-input"
            />
            <textarea
              value={facts}
              onChange={(e) => setFacts(e.target.value)}
              placeholder="Input your facts here"
              className="facts-input"
            />
          </div>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Processing...' : <ArrowUp size={24} />}
          </button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      {results && (
        <div className="results-container">
          <div className="info-boxes">
            {results.map((point, index) => (
              <div key={index} className="info-box">
                <div className="info-box-header">{point.title}</div>
                <div className="info-box-content">
                  <p>{point.explanation}</p>
                  {point.source && (
                    <div className="source-link-container">
                      <a href={point.source} target="_blank" rel="noopener noreferrer" className="source-link">
                        Source 
                        <span className="hover-overlay">
                          <ExternalLink size={16} /> Open in new tab
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DueDiligence;