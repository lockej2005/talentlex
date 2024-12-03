import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    checkUserVerificationAndAuth();
  }, []);

  const checkUserVerificationAndAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserEmail(user.email);
        
        // Check verification status
        const { data, error } = await supabase
          .from('profiles')
          .select('verified')
          .eq('email', user.email)
          .single();

        if (error) throw error;
        setIsVerified(data?.verified || false);

        // Only check auth if verified
        if (data?.verified) {
          await checkAuth();
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      setError('Failed to check user status');
    }
  };

  const sendVerificationEmail = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentUserEmail
      });
      if (error) throw error;
      setVerificationSent(true);
      setError(null);
    } catch (error) {
      console.error('Error sending verification:', error);
      setError('Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      startEmailMonitoring();
    }
  }, [isAuthenticated]);
  
  useEffect(() => {
    const handleOAuthComplete = (event) => {
      if (event.origin === 'http://localhost:5001' && event.data === 'oauth-complete') {
        console.log('OAuth flow completed');
        setIsConnecting(false);
        checkAuth(); // This will update the authentication state
      }
    };
  
    window.addEventListener('message', handleOAuthComplete);
    return () => window.removeEventListener('message', handleOAuthComplete);
  }, []);

  const checkAuth = async () => {
    try {
      console.log('Starting auth check...');
      const response = await fetch('http://localhost:5001/auth/check');
      const result = await response.json();
      console.log('Full auth check result:', result);
      
      if (result.user_email) {
        setCurrentUserEmail(result.user_email);
      }
      setIsAuthenticated(result.authenticated);
      return result.authenticated;
    } catch (error) {
      console.error('Auth check failed:', error);
      setError('Failed to check authentication status');
      return false;
    }
  };

  const startGmailSync = async () => {

    if (!isVerified) {
      setError('Please verify your email before connecting Gmail');
      return;
    }
    try {
      setIsConnecting(true);
      console.log('Making request to /auth/gmail...');
      
      const response = await fetch('http://localhost:5001/auth/gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
  
      console.log('Response received:', response);
      const result = await response.json();
      console.log('Parsed response:', result);
      
      if (result.auth_url) {
        console.log('Opening auth URL:', result.auth_url);
        
        // Add message listener for OAuth completion
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
        
        // Open OAuth window
        const authWindow = window.open(
          result.auth_url,
          'OAuth',
          'width=600,height=800,menubar=no,toolbar=no,location=no,status=no'
        );
  
        if (!authWindow) {
          throw new Error('Popup was blocked by the browser');
        }
  
        // Set timeout to clean up
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
  };

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

  const startEmailMonitoring = () => {
    fetchTodayEmails();
    const interval = setInterval(fetchTodayEmails, 10000);
    return () => clearInterval(interval);
  };

  const fetchTodayEmails = async () => {
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
  };

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
          {/* Add other tab content when implemented */}
        </div>
      </div>
    </div>
  );
};

export default TalentLexSearch;