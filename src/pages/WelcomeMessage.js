import React from 'react';
import { Info } from 'lucide-react';
import './WelcomeMessage.css';

const WelcomeMessage = () => {
  return (
    <div className="welcome-message">
      <Info size={24} className="welcome-icon" />
      <div className="welcome-content">
        <h1>Welcome to TalentLex</h1>
        <p>
        TalentLex is an AI-powered platform that tells you why you’ve been rejected by a law firm. Sign up and receive feedback on your applications. The firms available are all listed in your portal.
        </p>
        <p>
            You can use TalentLex to:
        </p>
        <ul>
          <li>Get Feedback on your Applications</li>
          <li>Track when others are hearing back from firms</li>
          <li>Create a first draft of your application</li>
          <li>Get feedback on your application if it’s been rejected</li>
        </ul>
        <p>
          Get started by completing your profile and clicking on "Add New firm +" button in the side bar. Select a Firm you want to refine your application for and fill out the questions in the "Application Review" tab.
        </p>
        <p>
          If you need help making a first draft for your application, you can use your "Draft Application feature". Once you press Send for Review on your Application Review tab a score will automatically be given to you for likelihood of acceptance.
        </p>
        <p>
          To calculate your most accurate score, also fill out your Work Experience in in the Firm Dashboard of each specific firm (they must be done for every individual firm) and fill out your profile here. Your written application, work experience and profile determines your firm score. 
        </p>
      </div>
    </div>
  );
};

export default WelcomeMessage;