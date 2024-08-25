import { supabase } from '../supabaseClient';
import { subtractCreditsAndUpdateUser } from './CreditManager';

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getResponse = async (agent, currentScenario, previousResponses) => {
  try {
    const response = await fetch(`/api/${agent}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        scenario: currentScenario, 
        previous_responses: previousResponses
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result && data.usage) {
      return {
        result: {
          side: agent === 'user_agent' ? 'user' : 'opposing',
          heading: data.result.heading || `${agent.split('_')[0].toUpperCase()} Response`,
          content: typeof data.result.content === 'object' ? JSON.stringify(data.result.content) : (data.result.content || 'No content provided'),
        },
        usage: data.usage
      };
    } else {
      throw new Error('Unexpected response structure');
    }
  } catch (error) {
    console.error('Error fetching response:', error);
    return {
      result: {
        side: agent === 'user_agent' ? 'user' : 'opposing',
        heading: 'Error',
        content: 'Failed to fetch response.',
      },
      usage: { total_tokens: 0 }
    };
  }
};

export const getFinalDecision = async (scenario, negotiationResults) => {
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
    if (!userOfferData.result || !userOfferData.usage) {
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
    if (!lawyerDecisionData.result || !lawyerDecisionData.usage) {
      throw new Error('Unexpected lawyer decision response structure');
    }

    return {
      userOffer: userOfferData.result,
      userOfferTokens: userOfferData.usage.total_tokens,
      lawyerDecision: lawyerDecisionData.result,
      lawyerDecisionTokens: lawyerDecisionData.usage.total_tokens
    };

  } catch (error) {
    console.error('Error getting final decision:', error);
    return {
      userOffer: { error: 'Failed to fetch user offer.' },
      userOfferTokens: 0,
      lawyerDecision: { error: 'Failed to fetch lawyer decision.' },
      lawyerDecisionTokens: 0
    };
  }
};

export const renderJsonStructure = (data, depth = 0) => {
  if (data === null || data === undefined) return 'N/A';

  if (typeof data !== 'object') {
    return String(data);
  }

  if (Array.isArray(data)) {
    return data.map((item, index) => ({
      key: index,
      value: renderJsonStructure(item, depth + 1)
    }));
  }

  return Object.entries(data).map(([key, value]) => ({
    key: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
    value: renderJsonStructure(value, depth + 1)
  }));
};