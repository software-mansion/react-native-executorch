import React from 'react';
import styles from './styles.module.css';
import HomepageButton from '@site/src/components/HomepageButton';
import ReactNativeExecuTorchFeatureList from '@site/src/components/ReactNativeExecuTorchFeatures/ReactNativeExecuTorchFeatureList';

const ReactNativeExecuTorchFeatures = () => {
  return (
    <div className={styles.featuresContainer}>
      <h2 className={styles.title}>Why React Native ExecuTorch?</h2>
      <ReactNativeExecuTorchFeatureList />
      <div className={styles.learnMoreSection}>
        <p>Learn more about React Native ExecuTorch</p>
        <HomepageButton
          target="_blank"
          href="https://blog.swmansion.com/introducing-react-native-executorch-2bdb87592884"
          title="See blog post"
          backgroundStyling={styles.featuresButton}
        />
      </div>
    </div>
  );
};

export default ReactNativeExecuTorchFeatures;
