import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { SpeedInsights } from "@vercel/speed-insights/react"
import Layout from './pages/Layout';
import ApplicationReview from './pages/ApplicationReview';
import GenerateDraft from './pages/GenerateDraft';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AIUsagePolicy from './pages/AIUsagePolicy';
import NegotiationSimulator from './pages/NegotiationSimulator';
import Videos from './pages/Videos';
import SpeakToFounders from './pages/SpeakToFounders';
import DueDiligence from './pages/DueDiligence';
import Profile from './pages/Profile';

const PrivateRoute = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return session ? children : <Navigate to="/signup" />;
};

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<ApplicationReview />} />
            <Route path="generate-draft" element={<GenerateDraft />} />
            <Route path="generate-draft/:id" element={<GenerateDraft />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="ai-usage-policy" element={<AIUsagePolicy />} />
            <Route path="negotiation-simulator" element={<NegotiationSimulator />} />
            <Route path="videos" element={<Videos />} />
            <Route path="speak-to-founders" element={<SpeakToFounders />} />
            <Route path="due-diligence" element={<DueDiligence />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
      <SpeedInsights />
    </>
  );
}

export default App;