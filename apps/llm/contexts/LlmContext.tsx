import React, {
  createContext,
  useState,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react';

type LlmContextType = {
  isGenerating: boolean;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
};

export const LlmContext = createContext<LlmContextType>({
  isGenerating: false,
  setIsGenerating: () => {},
});

export function useLlmContext() {
  const context = useContext(LlmContext);
  return context;
}

import { ReactNode } from 'react';

export const LlmProvider = ({ children }: { children: ReactNode }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  return (
    <LlmContext.Provider value={{ isGenerating, setIsGenerating }}>
      {children}
    </LlmContext.Provider>
  );
};
