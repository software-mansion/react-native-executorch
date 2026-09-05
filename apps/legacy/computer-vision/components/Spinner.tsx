import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import ColorPalette from '../colors';

interface SpinnerProps {
  visible: boolean;
  textContent: string;
}

const Spinner = ({ visible, textContent }: SpinnerProps) => {
  return (
    <Modal transparent={true} animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.text}>{textContent}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  container: {
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 15,
    color: ColorPalette.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Spinner;
