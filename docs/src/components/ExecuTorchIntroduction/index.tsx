import React from 'react';
import styles from './styles.module.css';

const ExecuTorchIntroduction = () => {
  return (
    <div className={styles.introductionContainer}>
      <h2 className={styles.title}>What is ExecuTorch?</h2>
      <p className={styles.introduction}>
        ExecuTorch is a novel AI framework from the PyTorch team which provides
        tools to export and run PyTorch models on edge devices like mobile
        phones and microcontrollers.
      </p>
    </div>
  );
};

export default ExecuTorchIntroduction;
