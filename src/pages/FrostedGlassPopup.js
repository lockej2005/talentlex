import React, { useState, useEffect } from 'react';

const FirmCountdownBar = ({ firm, dueDate, openDate }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const calculateProgress = () => {
      const now = new Date();
      if (dueDate) {
        const due = new Date(dueDate);
        if (now > due) {
          setProgress(100);
          setStatus('Closed');
        } else {
          const totalTime = due - new Date(openDate);
          const timeLeft = due - now;
          setProgress(((totalTime - timeLeft) / totalTime) * 100);
          setStatus('Open');
        }
      } else if (openDate) {
        const open = new Date(openDate);
        if (now < open) {
          setProgress(0);
          setStatus('Opening Soon');
        } else {
          setProgress(100);
          setStatus('Open');
        }
      }
    };

    calculateProgress();
    const timer = setInterval(calculateProgress, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [dueDate, openDate]);

  return (
    <div className="firm-countdown-bar">
      <div className="firm-name">{firm}</div>
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="status">{status}</div>
    </div>
  );
};

const FrostedGlassPopup = ({ onClose }) => {
  const firms = [
    { name: 'Sidley Austin', dueDate: '2024-09-13', openDate: '2024-08-28' },
    { name: 'Jones Day', openDate: '2024-09-01' },
    { name: 'Dechert', openDate: '2024-09-01' },
    { name: 'Willkie Farr & Gallagher', openDate: '2024-09-01' },
    { name: 'Bryan Cave Leighton Paisner', openDate: '2024-09-01' },
  ];

  return (
    <div className="frosted-glass-popup">
      <div className="popup-content">
        <h2>Next 5 Firms Recruiting</h2>
        <div className="firm-countdown-bars">
          {firms.map((firm, index) => (
            <FirmCountdownBar
              key={index}
              firm={firm.name}
              dueDate={firm.dueDate}
              openDate={firm.openDate}
            />
          ))}
        </div>
        <button onClick={onClose} className="close-button">Close</button>
      </div>
    </div>
  );
};

export default FrostedGlassPopup;