import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './UserLeaderboard.css';

const UserLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email');

      if (profilesError) throw profilesError;

      const { data: drafts, error: draftsError } = await supabase
        .from('draft_generations')
        .select('email, created_at');

      if (draftsError) throw draftsError;

      const { data: applications, error: applicationsError } = await supabase
        .from('applications')
        .select('email, timestamp');

      if (applicationsError) throw applicationsError;

      const userScores = profiles.map(profile => {
        const userDrafts = drafts.filter(draft => draft.email === profile.email);
        const userApplications = applications.filter(app => app.email === profile.email);
        const allEntries = [...userDrafts, ...userApplications];

        const score = allEntries.reduce((acc, entry) => {
          const entryDate = new Date(entry.created_at || entry.timestamp);
          if (entryDate >= oneWeekAgo) return acc + 10;
          if (entryDate >= oneMonthAgo) return acc + 5;
          return acc + 2;
        }, 0);

        const lastActiveDate = allEntries.length > 0
          ? new Date(Math.max(...allEntries.map(e => new Date(e.created_at || e.timestamp))))
          : null;

        return {
          ...profile,
          score,
          totalEntries: allEntries.length,
          draftEntries: userDrafts.length,
          applicationEntries: userApplications.length,
          lastActiveDate
        };
      });

      userScores.sort((a, b) => b.score - a.score);
      setLeaderboard(userScores.map((user, index) => ({ ...user, rank: index + 1 })));
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading leaderboard...</div>;
  }

  return (
    <div className="user-leaderboard">
      <h2>User Leaderboard</h2>
      <div className="leaderboard-grid">
        {leaderboard.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-rank">#{user.rank}</div>
            <div className="user-info">
              <h3>{user.name}</h3>
              <p className="user-email">{user.email}</p>
              <p className="user-uuid">UUID: {user.id}</p>
              <p className="user-score">Score: {user.score}</p>
              <p className="user-entries">Total Entries: {user.totalEntries}</p>
              <p className="user-subentries">
                Applications: {user.applicationEntries} | Drafts: {user.draftEntries}
              </p>
              <p className="user-last-active">
                Last Active: {user.lastActiveDate ? user.lastActiveDate.toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserLeaderboard;