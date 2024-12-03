import React from 'react';
import './Announcement.css';

const Announcement = () => {
  return (
    <div className="announcement">
      <div className="announcement-container">
        <div className="announcement-text">
          <span>🚀 Introducing the TalentLex Chrome Extension! Sync your app, see when others hear back and score higher on Watson Glaser</span>
        </div>
        <a 
          href="https://chromewebstore.google.com/detail/talentlex-extension/eillgeanejhcfgibpllnijadpkpmfmmg"
          target="_blank"
          rel="noopener noreferrer"
          className="announcement-button"
        >
          Download Now →
        </a>
      </div>
    </div>
  );
};

export default Announcement;