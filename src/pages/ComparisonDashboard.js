import React, { useState } from 'react';
import './ComparisonDashboard.css';

const ComparisonDashboard = () => {
  const [scenario, setScenario] = useState('');
  const [negotiationResults, setNegotiationResults] = useState([]);
  const [openItems, setOpenItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [userOffer, setUserOffer] = useState(null);
  const [lawyerDecision, setLawyerDecision] = useState(null);

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
    setIsLoading(true);
    setNegotiationResults([]);
    setOpenItems(new Set());
    setUserOffer(null);
    setLawyerDecision(null);
    try {
      let currentScenario = scenario;
      for (let i = 0; i < 5; i++) {
        await getResponse('user_agent', currentScenario, i * 2);
        await getResponse('opposition_agent', currentScenario, i * 2 + 1);
        currentScenario = `${scenario}\n\nPrevious offers:\n${negotiationResults[negotiationResults.length - 2]?.content || ''}\n${negotiationResults[negotiationResults.length - 1]?.content || ''}`;
      }
      await getFinalDecision();
    } catch (error) {
      console.error('Error:', error);
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
      
      setNegotiationResults(prev => {
        const newResults = [...prev];
        newResults[index] = {
          side: agent === 'user-agent' ? 'user' : 'opposing',
          heading: data.heading,
          content: data.content,
        };
        return newResults;
      });

      setOpenItems(prev => new Set([...prev, index]));
    } catch (error) {
      console.error('Error fetching response:', error);
      setNegotiationResults(prev => {
        const newResults = [...prev];
        newResults[index] = {
          side: agent === 'user-agent' ? 'user' : 'opposing',
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
      const userOfferResponse = await fetch('/api/user_decision', {
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
      setUserOffer(userOfferData);

      console.log('User offer data:', userOfferData);

      // Ensure userOfferData is not null or undefined
      if (!userOfferData) {
        throw new Error('User offer data is null or undefined');
      }

      // Get lawyer's decision
      const lawyerDecisionResponse = await fetch('/api/lawyer_decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          conversation_history: negotiationResults,
          user_offer: {
            offer_details: typeof userOfferData.offer_details === 'string' ? userOfferData.offer_details : JSON.stringify(userOfferData.offer_details),
            price: userOfferData.price.toString(),
            terms: typeof userOfferData.terms === 'string' ? userOfferData.terms : JSON.stringify(userOfferData.terms),
            extra: typeof userOfferData.extra === 'string' ? userOfferData.extra : JSON.stringify(userOfferData.extra)
          }
        }),
      });

      if (!lawyerDecisionResponse.ok) {
        throw new Error(`HTTP error! status: ${lawyerDecisionResponse.status}`);
      }

      const lawyerDecisionData = await lawyerDecisionResponse.json();
      setLawyerDecision(lawyerDecisionData);

    } catch (error) {
      console.error('Error getting final decision:', error);
      setUserOffer({ offer_details: 'Error', price: 'N/A', terms: 'N/A', extra: 'Failed to fetch user offer.' });
      setLawyerDecision({ decision: 'error', justification: 'Failed to fetch lawyer decision.' });
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
        {Object.entries(userOffer).map(([key, value]) => (
          <div key={key}>
            <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>
            {formatValue(value)}
          </div>
        ))}
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
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Submit'}
        </button>
      </div>
      <div className="arena-info-bar">
        Iterations: {Math.floor(negotiationResults.filter(Boolean).length / 2)} | 2 Parties (User's Lawyer and Opposing Lawyer)
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