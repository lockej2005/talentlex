import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Authentication.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/');  // Navigate to the home page on successful login
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
      alert('Password reset code sent. Please check your email.');
      navigate('/reset-password', { state: { email } });
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-page-auth">
    <div className="logo-auth">TalentLex</div>
      <div className="auth-container-auth">
        <div className="frosted-glass-auth">
          <h2>Login</h2>
          <form onSubmit={handleSubmit} className="auth-form-auth">
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
            <div className="forgot-password-auth">
              <a href="#" onClick={handleForgotPassword}>Forgot Password?</a>
            </div>
            <button type="submit" className="auth-button-auth">Login</button>
          </form>
          {error && <p className="error-message-auth">{error}</p>}
          <p>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;