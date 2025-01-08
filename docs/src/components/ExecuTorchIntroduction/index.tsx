import React from 'react';
import styles from './styles.module.css';

const ExecuTorchIntroduction = () => {
  return (
    <div className={styles.introductionContainer}>
      <h2 className={styles.title}>What is ExecuTorch?</h2>
      <p className={styles.introduction}>
        ExecuTorch is an end-to-end solution for enabling on-device inference
        capabilities across mobile and edge devices including wearables,
        embedded devices and microcontrollers. It is part of the PyTorch Edge
        ecosystem and enables efficient deployment of various PyTorch models to
        edge devices.
      </p>
    </div>
  );
};

export default ExecuTorchIntroduction;
