import Spinner from 'react-native-loading-spinner-overlay';
import { useTextToImage, BK_SDM_TINY_VPRED } from 'react-native-executorch';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ColorPalette from '../../colors';
import ProgressBar from '../../components/ProgressBar';

type InputState =
  | { kind: 'prompt'; value: string }
  | { kind: 'image'; uri: string };

export default function TextToImageScreen() {
  const [inferenceStepIdx, setInferenceStepIdx] = useState<number>(0);
  const [imageTitle, setImageTitle] = useState<string | null>(null);
  const [numSteps, setNumSteps] = useState<number>(10);

  const imageSize = 360;
  const model = useTextToImage({
    model: BK_SDM_TINY_VPRED,
    imageSize: imageSize,
    inferenceCallback: (x) => {
      setInferenceStepIdx(x);
    },
  });

  const { setGlobalGenerating } = useContext(GeneratingContext);

  const [inputState, setInputState] = useState<InputState>({
    kind: 'prompt',
    value: '',
  });

  useEffect(() => {
    setGlobalGenerating(model.isGenerating);
  }, [model.isGenerating, setGlobalGenerating]);

  const runForward = async () => {
    if (inputState.kind !== 'prompt' || !inputState.value.trim()) return;
    setImageTitle(inputState.value);
    try {
      const output = await model.generate(inputState.value, numSteps);
      if (!output.length) {
        setImageTitle(null);
        return;
      }
      setInputState({ kind: 'image', uri: output });
    } catch (e) {
      console.error(e);
      setImageTitle(null);
    } finally {
      setInferenceStepIdx(0);
    }
  };

  const decreaseSteps = () => setNumSteps((prev) => Math.max(5, prev - 5));
  const increaseSteps = () => setNumSteps((prev) => Math.min(50, prev + 5));

  if (!model.isReady) {
    return (
      <Spinner
        visible={!model.isReady}
        textContent={`Loading the model ${(model.downloadProgress * 100).toFixed(0)} %`}
      />
    );
  }

  if (!model.isGenerating) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.container}
          collapsable={false}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 40}
        >
          <View style={styles.titleContainer}>
            {imageTitle && <Text style={styles.titleText}>{imageTitle}</Text>}
          </View>
          <View style={styles.imageContainer}>
            {inputState.kind === 'image' ? (
              <Image
                style={styles.image}
                source={{ uri: `data:image/png;base64,${inputState.uri}` }}
              />
            ) : (
              <Image
                style={styles.image}
                source={require('../../assets/icons/executorch_logo.png')}
              />
            )}
          </View>
          <View style={styles.bottomContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter prompt..."
              value={inputState.kind === 'prompt' ? inputState.value : ''}
              onChangeText={(text) => {
                setInputState({ kind: 'prompt', value: text });
                setImageTitle(null);
              }}
              editable={!model.isGenerating}
            />
            <View style={styles.stepsPanel}>
              <Text style={styles.text}>Steps: {numSteps}</Text>
              <View style={styles.stepsButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.stepsButton]}
                  onPress={decreaseSteps}
                >
                  <Text style={styles.buttonText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.stepsButton]}
                  onPress={increaseSteps}
                >
                  <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={runForward}
              disabled={!model.isReady}
            >
              <Text style={styles.buttonText}>Run model</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 40}
    >
      <View style={styles.titleContainer}>
        {imageTitle && <Text style={styles.titleText}>{imageTitle}</Text>}
      </View>
      <View style={styles.progressContainer}>
        <Text style={styles.text}>Generating...</Text>
        <ProgressBar numSteps={numSteps} currentStep={inferenceStepIdx} />
      </View>
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => model.interrupt()}
        >
          <Text style={styles.buttonText}>Stop model</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  bottomContainer: {
    width: '100%',
    gap: 15,
    alignItems: 'center',
    padding: 16,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ColorPalette.primary,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  image: {
    width: 256,
    height: 256,
    marginVertical: 30,
    resizeMode: 'contain',
  },
  titleText: {
    color: ColorPalette.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepsPanel: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepsButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  stepsButton: {
    width: 40,
    height: 40,
  },
});
