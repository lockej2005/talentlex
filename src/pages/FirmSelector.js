import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './FirmSelector.css';

const FirmSelector = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [firms, setFirms] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchFirms();
  }, []);

  const fetchFirms = async () => {
    const { data, error } = await supabase
      .from('firms')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching firms:', error);
      setError('Failed to fetch firms. Please try again.');
    } else {
      setFirms(data);
    }
  };

  const handleFirmSelect = async (firmId, firmName) => {
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('firm_user_table')
        .upsert({ user_id: user.id, firm_id: firmId }, { onConflict: 'user_id,firm_id' })
        .select();

      if (error) throw error;
      
      navigate(`/firm/${firmId}`);
    } catch (error) {
      console.error('Error selecting firm:', error.message);
      setError('Failed to select firm. Please try again.');
    }
  };

  const filteredFirms = firms.filter(firm =>
    firm.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="firm-selector-container">
      <h2>Select a Firm</h2>
      <input
        type="text"
        placeholder="Search firms..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="firm-search-input"
      />
      {error && <div className="error-message">{error}</div>}
      <div className="firms-grid">
        {filteredFirms.map((firm) => (
          <div
            key={firm.id}
            className="firm-card"
            onClick={() => handleFirmSelect(firm.id, firm.name)}
          >
            {firm.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FirmSelector;