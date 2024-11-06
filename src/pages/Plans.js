import React, { useState } from 'react';
import './Plans.css';

const Plans = ({ onClose, userId }) => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePlanChange = (plan) => {
    setSelectedPlan(plan);
  };

  const handleCheckout = async () => {
    let priceId;

    switch(selectedPlan) {
      case 'monthly':
        priceId = 'price_1Q5v6H05kmxxE8ckRj5uBzNf';
        break;
      case 'quarterly':
        priceId = 'price_1Q7ldD05kmxxE8ckBibJNRvO';
        break;
      default:
        setError('Invalid plan selected');
        return;
    }

    setIsLoading(true);
    setError(null);
    // test commit to supabase_key
    try {
      const response = await fetch('/api/create_checkout_session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const session = await response.json();
      
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="plans-overlay-plan">
      <div className="plans-content-plan">
        <h2>Choose Your Plan</h2>
        <h3>Upgrade to a plan and get Infinite credits and Draft Generation</h3>
        <div className="plan-options-plan">
          <label className={`plan-option-plan ${selectedPlan === 'monthly' ? 'selected-plan' : ''}`}>
            <input
              type="radio"
              name="plan"
              value="monthly"
              checked={selectedPlan === 'monthly'}
              onChange={() => handlePlanChange('monthly')}
            />
            <span className="plan-details-plan">
              <span className="plan-name-plan">Monthly Plan</span>
              <span className="plan-price-plan">£15/month</span>
            </span>
          </label>
          <label className={`plan-option-plan ${selectedPlan === 'quarterly' ? 'selected-plan' : ''}`}>
            <input
              type="radio"
              name="plan"
              value="quarterly"
              checked={selectedPlan === 'quarterly'}
              onChange={() => handlePlanChange('quarterly')}
            />
            <span className="plan-details-plan">
              <span className="plan-name-plan">Quarterly Plan</span>
              <span className="plan-price-plan">£35/quarter</span>
              <span className="plan-savings-plan">Save £10/quarter</span>
            </span>
          </label>
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="plan-actions-plan">
          <button 
            className="checkout-btn-plan" 
            onClick={handleCheckout}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Upgrade Now'}
          </button>
          <button className="close-btn-plan" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Plans;