import React from 'react';
import styles from './styles.module.css';
import ReactNativeExecuTorchFeatureList from '@site/src/components/ReactNativeExecuTorchFeatures/ReactNativeExecuTorchFeatureList';

const ReactNativeExecuTorchFeatures = () => {
  return (
    <div className={styles.featuresContainer}>
      <h2 className={styles.title}>Why React Native ExecuTorch?</h2>
      <ReactNativeExecuTorchFeatureList />
    </div>
  );
};

export default ReactNativeExecuTorchFeatures;
