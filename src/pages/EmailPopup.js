import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './emailPopup.css';

// Initialize Supabase
const supabaseUrl = 'https://atbphpeswwgqvwlbplko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YnBocGVzd3dncXZ3bGJwbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMyNzY2MDksImV4cCI6MjAzODg1MjYwOX0.Imv3PmtGs9pGt6MvrvscR6cuv6WWCXKsSvwTZGjF4xU';
const supabase = createClient(supabaseUrl, supabaseKey);

function EmailPopup({ onClose }) {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();
    const screenSize = `${window.screen.width}x${window.screen.height}`;
    const device = navigator.userAgent;

    // Store email and details in Supabase
    const { data, error } = await supabase.from('emails').insert([
      { email, timestamp, screen_size: screenSize, device },
    ]);

    if (error) {
      console.error('Error inserting data:', error);
      return;
    }

    // Store email in a cookie to prevent popup from showing again
    document.cookie = `email=${email}; path=/; max-age=31536000`; // 1 year expiry

    // Close the popup
    onClose();
  };

  return (
    <div className="popup-container">
      <div className="popup-content">
        <h3>Account Beta</h3>
        <p>Enter your email and we'll send you updates</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Continue</button>
        </form>
      </div>
    </div>
  );
}

export default EmailPopup;