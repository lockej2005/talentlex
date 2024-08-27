import React, { createContext, useState } from 'react';

export const UserInputContext = createContext();

export const UserInputProvider = ({ children }) => {
  const [draftText, setDraftText] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState({});
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  
  // Application Review state
  const [applicationText, setApplicationText] = useState("Enter your application here or generate a draft.");
  const [reviewSelectedFirm, setReviewSelectedFirm] = useState(null);
  const [reviewSelectedQuestion, setReviewSelectedQuestion] = useState(null);
  const [feedback, setFeedback] = useState("");

  // Due Diligence state
  const [backgroundInfo, setBackgroundInfo] = useState('');
  const [facts, setFacts] = useState('');
  const [dueDiligenceResults, setDueDiligenceResults] = useState(null);
  const [searchQueries, setSearchQueries] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [creditsUsed, setCreditsUsed] = useState(null);
  const [newBalance, setNewBalance] = useState(null);

  // Negotiation Simulator state
  const [scenario, setScenario] = useState('');
  const [negotiationResults, setNegotiationResults] = useState([]);
  const [openItems, setOpenItems] = useState(new Set());
  const [userOffer, setUserOffer] = useState(null);
  const [lawyerDecision, setLawyerDecision] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);

  return (
    <UserInputContext.Provider value={{ 
      draftText, setDraftText, 
      additionalInfo, setAdditionalInfo, 
      selectedFirm, setSelectedFirm,
      selectedQuestion, setSelectedQuestion,
      applicationText, setApplicationText,
      reviewSelectedFirm, setReviewSelectedFirm,
      reviewSelectedQuestion, setReviewSelectedQuestion,
      feedback, setFeedback,
      // Due Diligence context
      backgroundInfo, setBackgroundInfo,
      facts, setFacts,
      dueDiligenceResults, setDueDiligenceResults,
      searchQueries, setSearchQueries,
      searchResults, setSearchResults,
      creditsUsed, setCreditsUsed,
      newBalance, setNewBalance,
      // Negotiation Simulator context
      scenario, setScenario,
      negotiationResults, setNegotiationResults,
      openItems, setOpenItems,
      userOffer, setUserOffer,
      lawyerDecision, setLawyerDecision,
      totalTokens, setTotalTokens
    }}>
      {children}
    </UserInputContext.Provider>
  );
};