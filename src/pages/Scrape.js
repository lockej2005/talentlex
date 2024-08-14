import React, { useState } from 'react';
import './Scrape.css';

const Scrape = () => {
  const [linkedinUrl, setLinkedinUrl] = useState('');

  const handleScrape = () => {
    // Implement scraping logic here
    console.log('Scraping:', linkedinUrl);
  };

  return (
    <div className="scrape-container">
      <h1 className="scrape-title">Scrape Your LinkedIn Account</h1>
      <div className="scrape-input-container">
        <input
          type="text"
          className="scrape-input"
          placeholder="Put LinkedIn URL here"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
        />
      </div>
      <button className="scrape-button" onClick={handleScrape}>
        Scrape
      </button>
    </div>
  );
};

export default Scrape;