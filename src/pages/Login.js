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
        // Password recovery event detected
        const newPassword = prompt('What would you like your new password to be?');
        if (newPassword) {
          const { data, error } = await supabase.auth.updateUser({ password: newPassword });
          if (data) {
            alert('Password updated successfully!');
            navigate('/login');  // Redirect to login page after successful password update
          }
          if (error) {
            alert('There was an error updating your password.');
          }
        }
      }
    });

    return () => {
      authListener?.unsubscribe();  // Clean up the listener on component unmount
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/');  // Navigate to the home page on successful login
    } catch (error) {
      setError(error.message);  // Display error message if login fails
    }
  };

  const handleForgotPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://talentlex-dev.vercel.app/reset-password',  // Use your production URL here
      });
      if (error) throw error;
      alert('Password reset email sent. Please check your inbox.');  // Inform user that reset email has been sent
    } catch (error) {
      setError(error.message);  // Display error message if reset request fails
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
      {error && <p className="error-message">{error}</p>}  {/* Display error message if exists */}
      <p>
        Don't have an account? <Link to="/signup">Sign up</Link>  {/* Link to signup page */}
      </p>
      <p>
        <button onClick={handleForgotPassword} className="forgot-password-link">Forgot Password?</button>  {/* Button to trigger password reset email */}
      </p>
    </div>
  );
};

export default Login;
