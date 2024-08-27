import React, { createContext, useState } from 'react';

export const UserInputContext = createContext();

export const UserInputProvider = ({ children }) => {
  const [draftText, setDraftText] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState({});
  const [selectedFirm, setSelectedFirm] = useState(null);
  
  // New state variables for application review
  const [applicationText, setApplicationText] = useState("Enter your application here...");
  const [reviewSelectedFirm, setReviewSelectedFirm] = useState(null);
  const [reviewSelectedQuestion, setReviewSelectedQuestion] = useState(null);
  const [feedback, setFeedback] = useState("");

  return (
    <UserInputContext.Provider value={{ 
      draftText, setDraftText, 
      additionalInfo, setAdditionalInfo, 
      selectedFirm, setSelectedFirm,
      applicationText, setApplicationText,
      reviewSelectedFirm, setReviewSelectedFirm,
      reviewSelectedQuestion, setReviewSelectedQuestion,
      feedback, setFeedback
    }}>
      {children}
    </UserInputContext.Provider>
  );
};