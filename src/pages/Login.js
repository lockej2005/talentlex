import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Authentication.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

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
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setMessage('Password reset email sent. Check your inbox.');
      setError(null);
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
      {message && <p className="success-message">{message}</p>}
      <p>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
      <p>
        <a href="#" onClick={handleForgotPassword}>Forgot Password?</a>
      </p>
    </div>
  );
};

export default Login;