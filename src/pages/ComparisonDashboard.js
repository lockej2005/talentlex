import React, { useState } from 'react';
import './ComparisonDashboard.css';

const ComparisonDashboard = () => {
  const [scenario, setScenario] = useState('');
  const [negotiationResults, setNegotiationResults] = useState([]);
  const [openItems, setOpenItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

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
    try {
      let currentScenario = scenario;
      for (let i = 0; i < 5; i++) {
        // User agent request
        const userResponse = await fetch('http://localhost:8000/api/user-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: currentScenario, previous_responses: negotiationResults })
        });
        const userData = await userResponse.json();
        setNegotiationResults(prev => [...prev, { side: 'user', title: `User Offer ${i+1}`, content: userData.response }]);

        // Opposition agent request
        const oppositionResponse = await fetch('http://localhost:8000/api/opposition-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: currentScenario, previous_responses: [...negotiationResults, { side: 'user', content: userData.response }] })
        });
        const oppositionData = await oppositionResponse.json();
        setNegotiationResults(prev => [...prev, { side: 'opposing', title: `Opposing Offer ${i+1}`, content: oppositionData.response }]);

        // Update current scenario for next iteration
        currentScenario = `${scenario}\n\nPrevious offers:\n${userData.response}\n${oppositionData.response}`;
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setIsLoading(false);
  };

  const renderColumn = (isLeft) => (
    <div className={`arena-column ${isLeft ? 'arena-left-column' : 'arena-right-column'}`}>
      {negotiationResults
        .filter(result => result.side === (isLeft ? 'user' : 'opposing'))
        .map((result, index) => {
          const globalIndex = isLeft ? index * 2 : index * 2 + 1;
          return (
            <div key={globalIndex} className="arena-item">
              <div className="arena-item-header" onClick={() => toggleItem(globalIndex)}>
                <span>{result.title}</span>
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
        Iterations: {Math.floor(negotiationResults.length / 2)} | 2 Parties (User's Lawyer and Opposing Lawyer)
      </div>
      <div className="arena-comparison-container">
        {renderColumn(true)}
        {renderColumn(false)}
      </div>
    </div>
  );
};

export default ComparisonDashboard;