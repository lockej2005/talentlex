import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Success.css';

const Success = () => {
  const [status, setStatus] = useState('loading');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPaymentAndUpdateSupabase = async () => {
      const sessionId = new URLSearchParams(location.search).get('session_id');
      
      if (!sessionId) {
        setStatus('error');
        return;
      }

      try {
        // Verify payment with your server
        const response = await fetch(`/api/verify_payment?session_id=${sessionId}`);
        const data = await response.json();

        if (data.paid) {
          // Update Supabase
          const { error } = await supabase
            .from('profiles')
            .update({ hasPlus: true })
            .eq('id', data.userId);

          if (error) {
            console.error('Error updating Supabase:', error);
            setStatus('error');
          } else {
            setStatus('success');
          }
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
      }
    };

    verifyPaymentAndUpdateSupabase();
  }, [location]);

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="success-container-success">
      {status === 'loading' && (
        <div className="loading-spinner-success">
          <div className="spinner-success"></div>
          <p>Verifying your payment...</p>
        </div>
      )}
      {status === 'error' && (
        <div className="error-message-success">
          <h2>Oops! Something went wrong.</h2>
          <p>There was an error processing your payment. Please contact support.</p>
          <button onClick={handleBackToDashboard} className="back-button-success">Back to Dashboard</button>
        </div>
      )}
      {status === 'success' && (
        <div className="success-message-success">
          <h1>Thank you for your purchase!</h1>
          <p>Your account has been successfully upgraded to TalentLex Plus.</p>
          <div className="checkmark-container-success">
            <div className="checkmark-success">
              <div className="checkmark_stem-success"></div>
              <div className="checkmark_kick-success"></div>
            </div>
          </div>
          <button onClick={handleBackToDashboard} className="back-button-success">Back to Dashboard</button>
        </div>
      )}
    </div>
  );
};

export default Success;