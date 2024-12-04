import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import './TalentLexSearch.css';

const API_CONFIG = {
    baseUrl: 'https://atbphpeswwgqvwlbplko.supabase.co/rest/v1',
    headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YnBocGVzd3dncXZ3bGJwbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMyNzY2MDksImV4cCI6MjAzODg1MjYwOX0.Imv3PmtGs9pGt6MvrvscR6cuv6WWCXKsSvwTZGjF4xU',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YnBocGVzd3dncXZ3bGJwbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMyNzY2MDksImV4cCI6MjAzODg1MjYwOX0.Imv3PmtGs9pGt6MvrvscR6cuv6WWCXKsSvwTZGjF4xU',
        'Content-Type': 'application/json'
    }
};

const TalentLexSearch = () => {
  const [todayEmails, setTodayEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [activeTab, setActiveTab] = useState('daily-updates');
  const [error, setError] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Define fetchTodayEmails before it's used in startEmailMonitoring
  const fetchTodayEmails = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      const { data, error } = await supabase
        .from('firm_email_logs')
        .select('*')
        .gte('created_at', todayStr)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupedEmails = data.reduce((groups, email) => {
        if (!groups[email.firm_email]) {
          groups[email.firm_email] = [];
        }
        groups[email.firm_email].push(email);
        return groups;
      }, {});

      setTodayEmails(groupedEmails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError('Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  }, []);

  // Define startEmailMonitoring with useCallback
  const startEmailMonitoring = useCallback(() => {
    fetchTodayEmails();
    const interval = setInterval(fetchTodayEmails, 10000);
    return () => clearInterval(interval);
  }, [fetchTodayEmails]);

  // Define checkAuth with useCallback
  const checkAuth = useCallback(async () => {
    try {
      if (!currentUserEmail) {
        console.log('No user email available yet');
        return false;
      }

      console.log('Starting auth check with email:', currentUserEmail);
      const response = await fetch(`http://localhost:5001/auth/check?email=${currentUserEmail}`, {
        headers: {
          'X-User-Email': currentUserEmail
        }
      });
      const result = await response.json();
      console.log('Full auth check result:', result);
      
      setIsAuthenticated(result.authenticated);
      return result.authenticated;
    } catch (error) {
      console.error('Auth check failed:', error);
      setError('Failed to check authentication status');
      return false;
    }
  }, [currentUserEmail]);

  // Define checkUserVerificationAndAuth with useCallback
  const checkUserVerificationAndAuth = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user data:', user);
      
      if (user) {
        console.log('Setting current user email:', user.email);
        setCurrentUserEmail(user.email);
        
        // Debug log the profiles table query
        const { data, error } = await supabase
          .from('profiles')
          .select('*')  // Select all fields for debugging
          .eq('email', user.email)
          .single();
  
        if (error) {
          console.error('Profile check error:', error);
          throw error;
        }
        
        console.log('Full profile data:', data);
        console.log('Verification status from profiles:', data?.verified);
        setIsVerified(data?.verified || false);
  
        if (data?.verified) {
          await checkAuth();
        }
      } else {
        console.log('No user found');
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      setError('Failed to check user status: ' + error.message);
    }
  }, [checkAuth]);

  const startGmailSync = useCallback(async () => {
    try {
      setIsConnecting(true);
      console.log('Making request to /auth/gmail with email:', currentUserEmail);
      
      const response = await fetch('http://localhost:5001/auth/gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: currentUserEmail }), // Properly format JSON
        mode: 'cors'
      });
  
      console.log('Response received:', response);
      const result = await response.json();
      console.log('Parsed response:', result);
      
      if (result.auth_url) {
        console.log('Opening auth URL:', result.auth_url);
        
        const messageListener = async (event) => {
          if (event.origin === 'http://localhost:5001' && event.data === 'oauth-success') {
            console.log('Received OAuth success message');
            window.removeEventListener('message', messageListener);
            const authStatus = await checkAuth();
            if (authStatus) {
              console.log('Authentication confirmed');
              setIsAuthenticated(true);
              startEmailMonitoring();
            }
            setIsConnecting(false);
          }
        };
        
        window.addEventListener('message', messageListener);
        
        const authWindow = window.open(
          result.auth_url,
          'OAuth',
          'width=600,height=800,menubar=no,toolbar=no,location=no,status=no'
        );
  
        if (!authWindow) {
          throw new Error('Popup was blocked by the browser');
        }
  
        setTimeout(() => {
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
        }, 120000);
        
      } else {
        throw new Error(result.error || 'Failed to get authentication URL');
      }
    } catch (error) {
      console.error('Detailed error:', error);
      setError('Failed to connect to Gmail. Please try again.');
      setIsConnecting(false);
    }
  }, [isVerified, checkAuth, startEmailMonitoring, currentUserEmail]);

  const sendVerificationEmail = async () => {
    try {
      setLoading(true);
      
      // Get the current user data directly from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        throw new Error('No email address available');
      }
  
      console.log('Sending verification email to:', user.email);
  
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback'
        }
      });
  
      if (error) {
        console.error('Supabase resend error:', error);
        throw error;
      }
  
      console.log('Verification email sent successfully');
      setVerificationSent(true);
      setError(null);
    } catch (error) {
      console.error('Error sending verification:', error);
      setError(`Failed to send verification email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // useEffect hooks
  useEffect(() => {
    checkUserVerificationAndAuth();
  }, [checkUserVerificationAndAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      startEmailMonitoring();
    }
  }, [isAuthenticated, startEmailMonitoring]);

  useEffect(() => {
    const handleOAuthComplete = (event) => {
      if (event.origin === 'http://localhost:5001' && event.data === 'oauth-complete') {
        console.log('OAuth flow completed');
        setIsConnecting(false);
        checkAuth();
      }
    };

    window.addEventListener('message', handleOAuthComplete);
    return () => window.removeEventListener('message', handleOAuthComplete);
  }, [checkAuth]);

  const renderDailyUpdates = () => (
    <div className="feed-container">
      <div className="date-header">
        <h2>Today - {new Date().toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</h2>
      </div>
      
      {loading ? (
        <div className="loading-spinner" />
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : Object.entries(todayEmails).length === 0 ? (
        <div className="firm-group">
          <div className="firm-header">
            <h3 className="firm-title">No emails received today</h3>
          </div>
        </div>
      ) : (
        Object.entries(todayEmails).map(([firmEmail, emails]) => (
          <div key={firmEmail} className="firm-group">
            <div className="firm-header">
              <h3 className="firm-title">{firmEmail}</h3>
            </div>
            <div className="email-list-container">
              {emails.map((email, index) => (
                <div key={index} className="email-item-compact">
                  <div className="email-meta">
                    <span>To: {email.recipient_email}</span>
                    <span>{new Date(email.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="email-subject">{email.subject || 'No subject'}</div>
                  <div className="email-body">{email.body}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Render verification screen if not verified
  if (!isVerified) {
    return (
      <div className="onboarding-screen">
        <div className="onboarding-content">
          <h1>Email Verification Required</h1>
          <div className="verification-container">
            <p className="description">
              Before connecting your Gmail account, please verify your email address: 
              <br />
              <strong>{currentUserEmail}</strong>
            </p>
            {verificationSent ? (
              <div className="verification-sent">
                <p>✓ Verification email sent!</p>
                <p>Please check your inbox and spam folder.</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="secondary-button"
                >
                  I've Verified My Email
                </button>
              </div>
            ) : (
              <button
                onClick={sendVerificationEmail}
                className="primary-button"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Verification Email'}
              </button>
            )}
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  // Render authentication screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="onboarding-screen">
        <div className="onboarding-content">
          <h1>TalentLex Search</h1>
          <p className="description">
            Monitor your law firm applications automatically. Connect your Gmail to start 
            tracking responses from law firms in real-time.
          </p>
          {error && <div className="error-text">{error}</div>}
          <button 
            onClick={startGmailSync} 
            className="primary-button"
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Gmail'}
          </button>
        </div>
      </div>
    );
  }

  // Main app render
  return (
    <div className="container">
      <div className="main-app">
        <h1>TalentLex Search</h1>
        
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'daily-updates' ? 'active' : ''}`}
            onClick={() => setActiveTab('daily-updates')}
          >
            Daily Updates
          </button>
          <button 
            className={`tab-button ${activeTab === 'firm-comms' ? 'active' : ''}`}
            onClick={() => setActiveTab('firm-comms')}
          >
            Firm Communications
          </button>
          <button 
            className={`tab-button ${activeTab === 'app-stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('app-stats')}
          >
            Application Stats
          </button>
        </div>

        {error && <div className="error-text">{error}</div>}
        
        <div className="tab-content">
          {activeTab === 'daily-updates' && renderDailyUpdates()}
        </div>
      </div>
    </div>
  );
};

export default TalentLexSearch;