import React, { useState } from 'react';
import axios from 'axios';
import './Scrape.css';

const Scrape = () => {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [scrapedData, setScrapedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScrape = async () => {
    setIsLoading(true);
    setError(null);
    setScrapedData(null);

    try {
      const response = await axios.post('http://localhost:5000/api/scrape_linkedin', { url: linkedinUrl });
      setScrapedData(response.data);
      console.log('Scraped data:', response.data);
    } catch (err) {
      setError('Error scraping profile. Please try again.');
      console.error('Scraping error:', err);
    } finally {
      setIsLoading(false);
    }
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
      <button className="scrape-button" onClick={handleScrape} disabled={isLoading}>
        {isLoading ? 'Scraping...' : 'Scrape'}
      </button>
      {error && <p className="error-message">{error}</p>}
      {scrapedData && (
        <div className="scraped-data">
          <h2>Scraped Information:</h2>
          <pre>{JSON.stringify(scrapedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Scrape;
