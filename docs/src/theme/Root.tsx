import React from 'react';
import FlameFooter from '@site/src/components/FlameFooter';

// Root wrapper - adds global flame footer
export default function Root({ children }) {
  console.log('🔥 Root component rendering with FlameFooter');
  return (
    <>
      {children}
      <FlameFooter />
    </>
  );
}
