import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Authentication.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthStateChange = async () => {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Password recovery event detected
        } else {
          // If no password recovery event, redirect to login
          navigate('/login');
        }
      });
    };

    handleAuthStateChange();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('Password updated successfully');
      navigate('/login');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit" className="auth-button">Update Password</button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default ResetPassword;
