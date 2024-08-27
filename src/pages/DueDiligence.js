import React, { useContext, useEffect } from 'react';
import { ArrowUp, ExternalLink } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { logToSupabase, fetchDueDiligenceResults } from '../utils/DueDiligenceUtils';
import { UserInputContext } from '../context/UserInputContext';
import './DueDiligence.css';

const DueDiligence = () => {
  const {
    backgroundInfo, setBackgroundInfo,
    facts, setFacts,
    dueDiligenceResults, setDueDiligenceResults,
    searchQueries, setSearchQueries,
    searchResults, setSearchResults,
    creditsUsed, setCreditsUsed,
    newBalance, setNewBalance
  } = useContext(UserInputContext);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [user, setUser] = React.useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchCurrentUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in to use this feature.");
      return;
    }

    setLoading(true);
    setError(null);
    setDueDiligenceResults(null);
    setSearchQueries(null);
    setSearchResults(null);
    setCreditsUsed(null);
    setNewBalance(null);

    try {
      const { results, searchQueries: queries, searchResults: sResults, creditsUsed: credits, newBalance: balance } = await fetchDueDiligenceResults(backgroundInfo, facts, user);

      setDueDiligenceResults(results);
      setSearchQueries(queries);
      setSearchResults(sResults);
      setCreditsUsed(credits);
      setNewBalance(balance);

      // Log to Supabase
      await logToSupabase({
        backgroundInfo,
        facts,
        results
      });
    } catch (error) {
      console.error('Error fetching results:', error);
      setError(error.message || 'An error occurred while processing your request. Please try again.');
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
          <button type="submit" className="submit-button-due" disabled={loading || !user}>
            {loading ? 'Processing...' : <ArrowUp size={24} />}
          </button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      {creditsUsed !== null && newBalance !== null && (
        <div className="credit-info">
          <p>Credits used: {creditsUsed}</p>
          <p>New balance: {newBalance}</p>
        </div>
      )}

      {dueDiligenceResults && (
        <div className="results-container">
          <div className="info-boxes">
            {dueDiligenceResults.map((point, index) => (
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