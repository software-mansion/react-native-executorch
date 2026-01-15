import React from 'react';
import styles from './styles.module.css';

const ReactNativeExecuTorchIntroduction = () => {
  return (
    <div className={styles.introductionContainer}>
      <h2 className={styles.title}>What is React Native ExecuTorch?</h2>
      <p className={styles.introduction}>
        React Native ExecuTorch brings Meta’s{' '}
        <a href="https://executorch.ai">ExecuTorch</a> AI framework into the
        React Native ecosystem, enabling developers to run AI models and LLMs
        locally, directly on mobile devices. It provides a declarative API for
        on-device inference, allowing you to use local AI models without relying
        on cloud infrastructure. Built on the ExecuTorch foundation – part of
        the PyTorch Edge ecosystem – it extends efficient on-device AI
        deployment to cross-platform mobile applications in React Native.
      </p>
    </div>
  );
};

export default ReactNativeExecuTorchIntroduction;
