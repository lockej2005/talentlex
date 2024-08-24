import React, { useState } from 'react';
import axios from 'axios';
import { ArrowUp, ExternalLink } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import './DueDiligence.css';

// Initialize Supabase client
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

const DueDiligence = () => {
  const [backgroundInfo, setBackgroundInfo] = useState('');
  const [facts, setFacts] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [searchQueries, setSearchQueries] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState(null);

  const logToSupabase = async (data) => {
    try {
      const { error } = await supabase
        .from('due_diligence_log')
        .insert([
          {
            background_info: data.backgroundInfo,
            facts: data.facts,
            point1_title: data.results[0]?.title || null,
            point1_body: data.results[0]?.explanation || null,
            point1_url: data.results[0]?.source || null,
            point2_title: data.results[1]?.title || null,
            point2_body: data.results[1]?.explanation || null,
            point2_url: data.results[1]?.source || null,
            point3_title: data.results[2]?.title || null,
            point3_body: data.results[2]?.explanation || null,
            point3_url: data.results[2]?.source || null,
            point4_title: data.results[3]?.title || null,
            point4_body: data.results[3]?.explanation || null,
            point4_url: data.results[3]?.source || null,
            point5_title: data.results[4]?.title || null,
            point5_body: data.results[4]?.explanation || null,
            point5_url: data.results[4]?.source || null,
            point6_title: data.results[5]?.title || null,
            point6_body: data.results[5]?.explanation || null,
            point6_url: data.results[5]?.source || null,
          }
        ]);

      if (error) throw error;
      console.log('Logged to Supabase successfully');
    } catch (error) {
      console.error('Error logging to Supabase:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setSearchQueries(null);
    setSearchResults(null);

    try {
      const response = await axios.post('/api/due_diligence', {
        prompt: `Background Information: ${backgroundInfo}\n\nFacts: ${facts}`
      });

      if (response.data && response.data.due_diligence_points) {
        setResults(response.data.due_diligence_points);
        setSearchQueries(response.data.search_queries);
        setSearchResults(response.data.scraped_contents);

        // Log to Supabase
        await logToSupabase({
          backgroundInfo,
          facts,
          results: response.data.due_diligence_points
        });
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