import React, { createContext, useContext } from 'react';

type DrawerContextType = {
  openDrawer: () => void;
  closeDrawer: () => void;
};

const DrawerContext = createContext<DrawerContextType | null>(null);

export const useDrawer = (): DrawerContextType => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
};

export const DrawerProvider = ({
  children,
  openDrawer,
  closeDrawer,
}: DrawerContextType & { children: React.ReactNode }) => {
  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
};
