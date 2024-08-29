import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthStateChange = async () => {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          const newPassword = prompt('What would you like your new password to be?');
          if (newPassword) {
            const { data, error } = await supabase.auth.updateUser({ password: newPassword });
            if (data) {
              alert('Password updated successfully!');
              navigate('/login');  // Redirect to login or any other page after success
            }
            if (error) {
              alert('There was an error updating your password.');
            }
          }
        }
      });
    };

    handleAuthStateChange();
  }, [navigate]);

  return (
    <div>
      <h2>Reset Password</h2>
      <p>If prompted, please enter your new password in the pop-up.</p>
      {error && <p>{error}</p>}
    </div>
  );
};

export default ResetPassword;
