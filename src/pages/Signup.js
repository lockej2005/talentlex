import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import SocietyCodeInput from './SocietyCodeInput';
import './Authentication.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [societyCode, setSocietyCode] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    // Validate society code format
    const societyCodeRegex = /^[A-Z]{3}[0-9]{3}$/;
    if (societyCode && !societyCodeRegex.test(societyCode)) {
      setError("Society code must be in the format 'ABC123'");
      return;
    }

    try {
      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      // If signup is successful, update the user's profile
      if (data && data.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            name,
            society: societyCode
          })
          .eq('id', data.user.id);

        if (updateError) throw updateError;
      }

      // Show success message and redirect
      alert('Signup successful! Please check your email to verify your account.');
      navigate('/login');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <label>Society Code (optional)</label>
        <SocietyCodeInput onChange={setSocietyCode} />
        <button type="submit" className="auth-button">Sign Up</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Signup;