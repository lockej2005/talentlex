import React, { createContext, useState } from 'react';

export const UserInputContext = createContext();

export const UserInputProvider = ({ children }) => {
  const [draftText, setDraftText] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState({});
  const [selectedFirm, setSelectedFirm] = useState(null);

  return (
    <UserInputContext.Provider value={{ draftText, setDraftText, additionalInfo, setAdditionalInfo, selectedFirm, setSelectedFirm }}>
      {children}
    </UserInputContext.Provider>
  );
};
