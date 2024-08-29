import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Authentication.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        const newPassword = prompt('What would you like your new password to be?');
        if (newPassword) {
          const { data, error } = await supabase.auth.updateUser({ password: newPassword });
          if (data) {
            alert('Password updated successfully!');
            navigate('/login');  // Redirect to login page or another page after successful update
          }
          if (error) {
            alert('There was an error updating your password.');
          }
        }
      }
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleForgotPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://talentlex.vercel.app/reset-password',  // Change this URL to your production URL when deploying
      });
      if (error) throw error;
      alert('Password reset email sent. Please check your inbox.');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="auth-button">Login</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      <p>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
      <p>
        <button onClick={handleForgotPassword} className="forgot-password-link">Forgot Password?</button>
      </p>
    </div>
  );
};

export default Login;
