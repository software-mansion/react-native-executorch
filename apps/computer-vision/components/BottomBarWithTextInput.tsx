import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ColorPalette from '../colors';

interface BottomBarProps {
  runModel: (input: string, numSteps: number) => void;
  stopModel: () => void;
  numSteps: number;
  setSteps: React.Dispatch<React.SetStateAction<number>>;
  isGenerating?: boolean;
  isReady?: boolean;
  showTextInput: boolean;
  setShowTextInput: React.Dispatch<React.SetStateAction<boolean>>;
  keyboardVisible: boolean;
}

export const BottomBarWithTextInput = ({
  runModel,
  stopModel,
  numSteps,
  setSteps,
  isGenerating,
  isReady,
  showTextInput,
  setShowTextInput,
  keyboardVisible,
}: BottomBarProps) => {
  const [input, setInput] = useState('');

  const decreaseSteps = () => setSteps((prev) => Math.max(5, prev - 5));
  const increaseSteps = () => setSteps((prev) => Math.min(50, prev + 5));

  if (!showTextInput) {
    if (isGenerating) {
      return (
        <TouchableOpacity
          style={styles.button}
          onPress={stopModel}
          disabled={!isReady}
        >
          <Text style={styles.buttonText}>Stop model</Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowTextInput(true)}
          disabled={!isReady}
        >
          <Text style={styles.buttonText}>Run model</Text>
        </TouchableOpacity>
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      collapsable={false}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 40}
    >
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter prompt..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity
          style={[styles.button, styles.iconButton]}
          onPress={() => {
            setShowTextInput(false);
            setInput('');
            runModel(input, numSteps);
          }}
          disabled={!isReady || isGenerating}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.stepsContainer}>
        <Text style={[styles.text, keyboardVisible && styles.textWhite]}>
          Steps: {numSteps}
        </Text>
        <View style={styles.stepsButtons}>
          <TouchableOpacity
            style={[styles.button, styles.iconButton]}
            onPress={decreaseSteps}
          >
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.iconButton]}
            onPress={increaseSteps}
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 6,
    padding: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    color: '#000',
  },
  stepsContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stepsButtons: {
    flexDirection: 'row',
  },
  button: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ColorPalette.primary,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  iconButton: {
    marginHorizontal: 5,
    width: 40,
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  textWhite: {
    color: '#fff',
  },
});
