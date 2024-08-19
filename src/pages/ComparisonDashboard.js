import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './ComparisonDashboard.css';

// Initialize Supabase
const supabaseUrl = 'https://atbphpeswwgqvwlbplko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YnBocGVzd3dncXZ3bGJwbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMyNzY2MDksImV4cCI6MjAzODg1MjYwOX0.Imv3PmtGs9pGt6MvrvscR6cuv6WWCXKsSvwTZGjF4xU';
const supabase = createClient(supabaseUrl, supabaseKey);

const ComparisonDashboard = () => {
  const [scenario, setScenario] = useState('');
  const [negotiationResults, setNegotiationResults] = useState([]);
  const [openItems, setOpenItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [userOffer, setUserOffer] = useState(null);
  const [lawyerDecision, setLawyerDecision] = useState(null);
  const [user, setUser] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getCurrentUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const toggleItem = (index) => {
    setOpenItems(prevOpenItems => {
      const newOpenItems = new Set(prevOpenItems);
      if (newOpenItems.has(index)) {
        newOpenItems.delete(index);
      } else {
        newOpenItems.add(index);
      }
      return newOpenItems;
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      setError("Please log in to use this feature.");
      return;
    }

    setIsLoading(true);
    setNegotiationResults([]);
    setOpenItems(new Set());
    setUserOffer(null);
    setLawyerDecision(null);
    setTotalTokens(0);
    setError(null);

    try {
      let currentScenario = scenario;
      for (let i = 0; i < 5; i++) {
        await getResponse('user_agent', currentScenario, i * 2);
        await getResponse('opposition_agent', currentScenario, i * 2 + 1);
        currentScenario = `${scenario}\n\nPrevious offers:\n${negotiationResults[negotiationResults.length - 2]?.content || ''}\n${negotiationResults[negotiationResults.length - 1]?.content || ''}`;
      }
      await getFinalDecision();

      // Calculate cost and subtract credits
      const cost = Math.round(totalTokens * 0.005);
      await subtractCredits(cost);
    } catch (error) {
      console.error('Error:', error);
      setError("An error occurred while processing your request.");
    }
    setIsLoading(false);
  };

  const getResponse = async (agent, currentScenario, index) => {
    try {
      const response = await fetch(`/api/${agent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scenario: currentScenario, 
          previous_responses: negotiationResults
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      
      if (data.result && data.usage) {
        setNegotiationResults(prev => {
          const newResults = [...prev];
          newResults[index] = {
            side: agent === 'user_agent' ? 'user' : 'opposing',
            heading: data.result.heading || `${agent.split('_')[0].toUpperCase()} Response`,
            content: data.result.content || 'No content provided',
          };
          return newResults;
        });

        setOpenItems(prev => new Set([...prev, index]));

        // Update total tokens
        setTotalTokens(prev => prev + data.usage.total_tokens);
      } else {
        throw new Error('Unexpected response structure');
      }
    } catch (error) {
      console.error('Error fetching response:', error);
      setNegotiationResults(prev => {
        const newResults = [...prev];
        newResults[index] = {
          side: agent === 'user_agent' ? 'user' : 'opposing',
          heading: 'Error',
          content: 'Failed to fetch response.',
        };
        return newResults;
      });
    }
  };

  const getFinalDecision = async () => {
    try {
      // Get user's final offer
      const userOfferResponse = await fetch('/api/user_descision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scenario, 
          conversation_history: negotiationResults
        }),
      });

      if (!userOfferResponse.ok) {
        throw new Error(`HTTP error! status: ${userOfferResponse.status}`);
      }

      const userOfferData = await userOfferResponse.json();
      if (userOfferData.result && userOfferData.usage) {
        setUserOffer(userOfferData.result);
        setTotalTokens(prev => prev + userOfferData.usage.total_tokens);
      } else {
        throw new Error('Unexpected user offer response structure');
      }

      // Get lawyer's decision
      const lawyerDecisionResponse = await fetch('/api/lawyer_descision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          conversation_history: negotiationResults,
          user_offer: userOfferData.result
        }),
      });

      if (!lawyerDecisionResponse.ok) {
        throw new Error(`HTTP error! status: ${lawyerDecisionResponse.status}`);
      }

      const lawyerDecisionData = await lawyerDecisionResponse.json();
      if (lawyerDecisionData.result && lawyerDecisionData.usage) {
        setLawyerDecision(lawyerDecisionData.result);
        setTotalTokens(prev => prev + lawyerDecisionData.usage.total_tokens);
      } else {
        throw new Error('Unexpected lawyer decision response structure');
      }

    } catch (error) {
      console.error('Error getting final decision:', error);
      setUserOffer({ offer_details: 'Error', price: 'N/A', terms: 'N/A', extra: 'Failed to fetch user offer.' });
      setLawyerDecision({ decision: 'error', justification: 'Failed to fetch lawyer decision.' });
    }
  };

  const subtractCredits = async (cost) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      if (userData.credits < cost) {
        throw new Error('Insufficient credits');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: userData.credits - cost })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setError(`Credits subtracted: ${cost}. Remaining credits: ${userData.credits - cost}`);
    } catch (error) {
      console.error('Error subtracting credits:', error);
      setError(error.message === 'Insufficient credits' 
        ? "Error: Insufficient credits to complete this operation." 
        : "Error: Unable to process credits. Please try again later.");
    }
  };

  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <ul>
          {Object.entries(value).map(([key, val]) => (
            <li key={key}>
              <strong>{key}:</strong> {formatValue(val)}
            </li>
          ))}
        </ul>
      );
    }
    return String(value);
  };

  const renderUserOffer = () => {
    if (!userOffer) return null;

    return (
      <div className="arena-final-decision">
        <h3>User's Final Offer:</h3>
        <p><strong>Offer Details:</strong> {userOffer.offer_details}</p>
        <p><strong>Price:</strong> ${userOffer.price}</p>
        <p><strong>Terms:</strong></p>
        {formatValue(userOffer.terms)}
        <p><strong>Extra:</strong> {userOffer.extra}</p>
      </div>
    );
  };

  const renderLawyerDecision = () => {
    if (!lawyerDecision) return null;

    return (
      <div className="arena-final-decision">
        <h3>Lawyer's Decision:</h3>
        <p><strong>Decision:</strong> {lawyerDecision.decision}</p>
        <p><strong>Justification:</strong> {lawyerDecision.justification}</p>
      </div>
    );
  };

  const renderColumn = (isLeft) => (
    <div className={`arena-column ${isLeft ? 'arena-left-column' : 'arena-right-column'}`}>
      {negotiationResults
        .filter(result => result && result.side === (isLeft ? 'user' : 'opposing'))
        .map((result, index) => {
          const globalIndex = isLeft ? index * 2 : index * 2 + 1;
          return (
            <div key={globalIndex} className="arena-item">
              <div className="arena-item-header" onClick={() => toggleItem(globalIndex)}>
                <span>{result.heading}</span>
                <span className={`arena-expand-button ${openItems.has(globalIndex) ? 'open' : ''}`}>
                  {openItems.has(globalIndex) ? '−' : '+'}
                </span>
              </div>
              {openItems.has(globalIndex) && (
                <div className="arena-item-content">
                  {result.content}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );

  return (
    <div className="arena-comparison-dashboard">
      <div className="arena-input-area">
        <textarea
          placeholder="Enter your scenario and preferred outcome here"
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          rows={3}
        />
        <button 
          className="arena-upload-button" 
          onClick={handleSubmit} 
          disabled={isLoading || !user}
        >
          {isLoading ? 'Processing...' : 'Submit'}
        </button>
      </div>
      {error && <div className="arena-error">{error}</div>}
      <div className="arena-info-bar">
        Iterations: {Math.floor(negotiationResults.filter(Boolean).length / 2)} | 2 Parties (User's Lawyer and Opposing Lawyer) | Total Tokens: {totalTokens}
      </div>
      <div className="arena-comparison-container">
        {renderColumn(true)}
        {renderColumn(false)}
      </div>
      {renderUserOffer()}
      {renderLawyerDecision()}
    </div>
  );
};

export default ComparisonDashboard;