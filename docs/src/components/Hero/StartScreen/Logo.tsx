import React from 'react';
import useScreenSize from '@site/src/hooks/useScreenSize';
import useBaseUrl from '@docusaurus/useBaseUrl';

const Logo = () => {
  const { windowWidth } = useScreenSize();
  const gifUrl = useBaseUrl('/img/logo-hero-flame.gif');

  if (windowWidth <= 768) {
    return null;
  }

  return (
    <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
      <img
        src={gifUrl}
        alt="React Native ExecuTorch 🔥💀"
        style={{ maxWidth: '400px', width: '100%' }}
      />
    </div>
  );
};

export default Logo;
