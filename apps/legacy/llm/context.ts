import { createContext } from 'react';

export const GeneratingContext = createContext({
  setGlobalGenerating: (_newState: boolean) => {},
});
