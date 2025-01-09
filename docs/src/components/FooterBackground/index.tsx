import React from 'react';
import usePageType from '@site/src/hooks/usePageType';
import WaveBottom from '@site/src/components/Wave/WaveBottom';
import styles from './styles.module.css';

const FooterBackground = () => {
  const { isLanding } = usePageType();

  return (
    <div className={styles.waveContainer}>
      {isLanding && (
        <>
          <WaveBottom />
          <div className={styles.linearGradient} />
        </>
      )}
    </div>
  );
};

export default FooterBackground;
