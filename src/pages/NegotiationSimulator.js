import React, { useContext, useEffect, useState } from 'react';
import './NegotiationSimulator.css';
import {
  getCurrentUser,
  getResponse,
  getFinalDecision,
  renderJsonStructure
} from '../utils/NegotiationSimulatorUtils';
import { subtractCreditsAndUpdateUser } from '../utils/CreditManager';
import { UserInputContext } from '../context/UserInputContext';

const NegotiationSimulator = () => {
  const {
    scenario, setScenario,
    negotiationResults, setNegotiationResults,
    openItems, setOpenItems,
    userOffer, setUserOffer,
    lawyerDecision, setLawyerDecision,
    totalTokens, setTotalTokens
  } = useContext(UserInputContext);

  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };

    fetchCurrentUser();
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
        const userResponse = await getResponse('user_agent', currentScenario, negotiationResults);
        const oppositionResponse = await getResponse('opposition_agent', currentScenario, negotiationResults);
        
        setNegotiationResults(prev => [...prev, userResponse.result, oppositionResponse.result]);
        setOpenItems(prev => new Set([...prev, i*2, i*2+1]));
        setTotalTokens(prev => prev + userResponse.usage.total_tokens + oppositionResponse.usage.total_tokens);
        
        currentScenario = `${scenario}\n\nPrevious offers:\n${userResponse.result.content}\n${oppositionResponse.result.content}`;
      }
      
      const finalDecision = await getFinalDecision(scenario, negotiationResults);
      setUserOffer(finalDecision.userOffer);
      setLawyerDecision(finalDecision.lawyerDecision);
      setTotalTokens(prev => prev + finalDecision.userOfferTokens + finalDecision.lawyerDecisionTokens);

      // After all API calls are complete, subtract credits
      const { success, cost, newBalance, error: creditError } = await subtractCreditsAndUpdateUser(user.id, totalTokens);
      if (!success) {
        throw new Error(creditError);
      }
      setError(`Credits used: ${cost}. Remaining credits: ${newBalance}`);
    } catch (error) {
      console.error('Error:', error);
      setError("An error occurred while processing your request: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStructureAsJsx = (structure) => {
    if (Array.isArray(structure)) {
      return (
        <ul style={{ paddingLeft: '20px', listStyleType: 'none' }}>
          {structure.map((item, index) => (
            <li key={index}>
              <strong>{item.key}:</strong> {renderStructureAsJsx(item.value)}
            </li>
          ))}
        </ul>
      );
    } else if (typeof structure === 'object' && structure !== null) {
      return (
        <div>
          {Object.entries(structure).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {renderStructureAsJsx(value)}
            </div>
          ))}
        </div>
      );
    } else {
      return String(structure);
    }
  };

  const renderDecision = (title, data) => {
    if (!data) return null;
  
    return (
      <div className="arena-final-decision">
        <h3>{title}:</h3>
        {data.error ? (
          <p>{data.error}</p>
        ) : (
          renderStructureAsJsx(renderJsonStructure(data))
        )}
      </div>
    );
  };

  const renderColumn = (isLeft) => (
    <div className={`arena-column ${isLeft ? 'arena-left-column' : 'arena-right-column'}`}>
      <h2 className="arena-column-heading">
        {isLeft ? "Your Lawyer" : "Opposition Lawyer"}
      </h2>
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
                  {typeof result.content === 'object' ? JSON.stringify(result.content) : result.content}
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
      <div className="arena-info-bar">
        Iterations: {Math.floor(negotiationResults.filter(Boolean).length / 2)} | 2 Parties (User's Lawyer and Opposing Lawyer) | Total Tokens: {totalTokens}
      </div>
      {error && <div className="arena-error">{error}</div>}
      <div className="arena-comparison-container">
        {renderColumn(true)}
        {renderColumn(false)}
      </div>
      {renderDecision("User's Final Offer", userOffer)}
      {renderDecision("Lawyer's Decision", lawyerDecision)}
    </div>
  );
};

export default NegotiationSimulator;