import React, { createContext, useContext, useState } from 'react';

const EmotionContext = createContext(null);

export const EmotionProvider = ({ children }) => {
  const [emotionList, setEmotionList] = useState([]);

  return (
    <EmotionContext.Provider value={{ emotionList, setEmotionList }}>
      {children}
    </EmotionContext.Provider>
  );
};

export const useEmotion = () => useContext(EmotionContext);