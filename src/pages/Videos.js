import React from 'react';
import { ExternalLink } from 'lucide-react';
import './Videos.css';

// Simple Card component
const Card = ({ children, className }) => (
  <div className={`card ${className || ''}`}>
    {children}
  </div>
);

// Simple Button component
const Button = ({ children, onClick, className }) => (
  <button className={`button ${className || ''}`} onClick={onClick}>
    {children}
  </button>
);

const VideoCard = ({ title, description, link }) => {
  // Extract the video ID from the Loom share link
  const videoId = link.split('/').pop().split('?')[0];
  const embedLink = `https://www.loom.com/embed/${videoId}`;

  return (
    <Card className="video-card">
      <h2 className="video-title">{title}</h2>
      <div className="video-wrapper">
        <iframe 
          src={embedLink}
          frameBorder="0" 
          allowFullScreen
        ></iframe>
      </div>
      <p className="video-description">{description}</p>
      <Button className="video-button" onClick={() => window.open(link, '_blank')}>
        <ExternalLink className="button-icon" /> Open in Loom
      </Button>
    </Card>
  );
};

const Videos = () => {
  const videos = [
    {
        title: "First project Update and Website Demo.",
        description: "Our first implementation fo the feedback functionality.",
        link: "https://www.loom.com/share/6287497ef83c4ed289148fab7cee4220?sid=5bb8ec3c-c8ac-453b-a475-ccdac370d7cd"
      },
    {
      title: "Application Drafting Feature",
      description: "Draft and get Feedback on Applications",
      link: "https://www.loom.com/share/d757852d58674a2cbeb8c3f6b5d3cb9d?sid=793a0f3d-e638-4fb8-aa4e-0a4c4df631d5"
    }

  ];

  return (
    <div className="videos-container">
      <h1 className="videos-title">Instruction Videos</h1>
      <div className="videos-grid">
        {videos.map((video, index) => (
          <VideoCard key={index} {...video} />
        ))}
      </div>
    </div>
  );
};

export default Videos;