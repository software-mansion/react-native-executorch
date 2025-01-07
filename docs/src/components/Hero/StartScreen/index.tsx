import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './styles.module.css';
import HomepageButton from '@site/src/components/HomepageButton';
import Logo from './Logo';

const StartScreen = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.heading}>
        <div className={styles.subheadingContainer}>
          <div>
            <h1 className={styles.headingLabel}>
              <span>React Native</span>
              <span>ExecuTorch</span>
            </h1>
            <h2 className={styles.subheadingLabel}>
              Declarative way to run AI models in React Native on device,
              powered by ExecuTorch.
            </h2>
          </div>
          <BrowserOnly>{() => <Logo />}</BrowserOnly>
        </div>
        <div className={styles.lowerHeading}>
          <div className={styles.buttonContainer}>
            <HomepageButton
              href="/react-native-executorch/docs/fundamentals/getting-started"
              title="Get started"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default StartScreen;
