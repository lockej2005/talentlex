import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './FirmRanks.css';

const FirmRanks = () => {
  const [rankings, setRankings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRankMe = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Call the rank-firms endpoint
      const response = await fetch('http://localhost:5000/rank-firms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile: JSON.stringify(profileData) }),
      });

      if (!response.ok) throw new Error('Failed to fetch rankings');

      const data = await response.json();
      const parsedResponse = JSON.parse(data.response.replace(/```json\n|\n```/g, ''));
      setRankings(parsedResponse);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="firm-ranks">
      <h1>Firm Rankings</h1>
      <button onClick={handleRankMe} className="rank-me-btn" disabled={loading}>
        {loading ? 'Ranking...' : 'Rank Me'}
      </button>
      {error && <p className="error-message">{error}</p>}
      {rankings && (
        <div className="rankings-container">
          <div className="leaderboard">
            {rankings.law_firms.map((firm, index) => (
              <div key={firm.name} className="firm-rank">
                <span className="rank">{index + 1}</span>
                <span className="firm-name">{firm.name}</span>
                <span className="relevancy-score">{(firm.relevancy_rank * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
          <div className="justification">
            <h2>Justification</h2>
            <p>{rankings.justification}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirmRanks;