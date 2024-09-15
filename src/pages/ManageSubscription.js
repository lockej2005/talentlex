import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './ManageSubscription.css';

const ManageSubscription = ({ onClose, userId }) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch(`/api/payment_history?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch payment history');
      const data = await response.json();
      setPaymentHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    if (window.confirm('Are you sure you want to request cancellation of your subscription?')) {
      const subject = encodeURIComponent('Cancel TalentLex Subscription');
      const body = encodeURIComponent(`Hello,\n\nI would like to cancel my TalentLex subscription. My user ID is: ${userId}\n\nThank you.`);
      window.location.href = `mailto:josh.locke@outlook.com,chaituprakash06@gmail.com?subject=${subject}&body=${body}`;
    }
  };

  if (loading) return <div className="loading-managesub">Loading...</div>;
  if (error) return <div className="error-managesub">{error}</div>;

  return (
    <div className="manage-subscription-container-managesub">
      <h2>Manage Your Subscription</h2>
      <div className="payment-history-managesub">
        <h3>Payment History</h3>
        {paymentHistory.length > 0 ? (
          <ul>
            {paymentHistory.map((payment, index) => (
              <li key={index}>
                <span>{new Date(payment.date).toLocaleDateString()}</span>
                <span>{payment.amount}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No payment history available.</p>
        )}
      </div>
      <div className="subscription-actions-managesub">
        <button onClick={handleCancelSubscription} className="cancel-subscription-btn-managesub">
          Request Cancellation
        </button>
        <button onClick={onClose} className="close-btn-managesub">Close</button>
      </div>
    </div>
  );
};

export default ManageSubscription;