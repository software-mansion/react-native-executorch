import React from 'react';
import { View, StyleSheet } from 'react-native';
import ColorPalette from '../colors';

type ProgressBarProps = {
  numSteps: number;
  currentStep: number;
};

export default function ProgressBar({
  numSteps,
  currentStep,
}: ProgressBarProps) {
  return (
    <View style={styles.progressBarContainer}>
      {Array.from({ length: numSteps }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressStep,
            i < currentStep
              ? styles.progressStepActive
              : styles.progressStepInactive,
            i === 0 && styles.progressStepFirst,
            i === numSteps - 1 && styles.progressStepLast,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    width: '80%',
  },
  progressStep: {
    flex: 1,
    height: 15,
  },
  progressStepActive: {
    backgroundColor: ColorPalette.primary,
  },
  progressStepInactive: {
    backgroundColor: '#e0e0e0',
  },
  progressStepFirst: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  progressStepLast: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
});
