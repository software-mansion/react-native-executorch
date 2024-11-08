import React from 'react';
import styles from './styles.module.css';
import Layout from '@theme/Layout';
import HomepageStartScreen from '@site/src/components/Hero/StartScreen';
import { HireUsSection } from '@swmansion/t-rex-ui';
import LogoHero from '@site/static/img/logo-hero.svg';
import HomepageButton from '@site/src/components/HomepageButton';

function Home() {
  return (
    <Layout
      title={`React Native ExecuTorch`}
      description="Declarative way to run AI models in React Native on device, powered by ExecuTorch."
    >
      <div className={styles.container}>
        <HomepageStartScreen />
      </div>
      <div
        style={{
          marginTop: '300px',
          marginBottom: '350px',
          gap: '30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <LogoHero />
        <h2>This site is under development</h2>
        <a href="/react-native-executorch/docs/fundamentals/getting-started">
          <HomepageButton
            href="/react-native-executorch/docs/fundamentals/getting-started"
            title="Checkout the docs"
          />
        </a>
      </div>
      <div className={styles.container}>
        <HireUsSection
          href={
            'https://swmansion.com/contact/projects?utm_source=react-native-executorch&utm_medium=docs'
          }
        />
      </div>
    </Layout>
  );
}

export default Home;
