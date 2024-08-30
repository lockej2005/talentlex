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

    const societyCodeRegex = /^[A-Z]{3}[0-9]{3}$/;
    if (societyCode && !societyCodeRegex.test(societyCode)) {
      setError("Society code must be in the format 'ABC123'");
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

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

      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-page-auth">
      <div className="logo-auth">TalentLex</div>
      <div className="auth-container-auth">
        <div className="frosted-glass-auth">
          <h2>Sign Up</h2>
          <form onSubmit={handleSubmit} className="auth-form-auth">
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
            <label className='text-auth'>Society Code (optional)</label>
            <SocietyCodeInput onChange={setSocietyCode} />
            <button type="submit" className="auth-button-auth">Sign Up</button>
          </form>
          {error && <p className="error-message-auth">{error}</p>}
          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;