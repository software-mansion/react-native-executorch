import {
  View,
  StyleSheet,
  Text,
  Image,
  Keyboard,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import Spinner from '../../components/Spinner';
import {
  useTextToImage,
  BK_SDM_TINY_VPRED_256,
  BK_SDM_TINY_VPRED_512,
  TextToImageProps,
} from 'react-native-executorch';
import { ModelPicker, ModelOption } from '../../components/ModelPicker';
import { GeneratingContext } from '../../context';
import ColorPalette from '../../colors';
import ProgressBar from '../../components/ProgressBar';
import { Ionicons } from '@expo/vector-icons';
import { StatsBar } from '../../components/StatsBar';
import ErrorBanner from '../../components/ErrorBanner';

type TextToImageModelSources = TextToImageProps['model'];

const MODELS: ModelOption<TextToImageModelSources>[] = [
  { label: 'BK-SDM 256', value: BK_SDM_TINY_VPRED_256 },
  { label: 'BK-SDM 512', value: BK_SDM_TINY_VPRED_512 },
];

export default function TextToImageScreen() {
  const [inferenceStepIdx, setInferenceStepIdx] = useState<number>(0);
  const [image, setImage] = useState<string | null>(null);
  const [steps, setSteps] = useState<number>(40);

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<TextToImageModelSources>(
    BK_SDM_TINY_VPRED_256
  );
  const [generationTime, setGenerationTime] = useState<number | null>(null);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageTitle, setImageTitle] = useState<string | null>(null);

  const imageSize = 224;
  const model = useTextToImage({
    model: selectedModel,
    inferenceCallback: (x) => setInferenceStepIdx(x),
  });

  const { setGlobalGenerating } = useContext(GeneratingContext);

  useEffect(() => {
    setGlobalGenerating(model.isGenerating);
  }, [model.isGenerating, setGlobalGenerating]);

  useEffect(() => {
    if (model.error) setError(String(model.error));
  }, [model.error]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const runForward = async () => {
    if (!input.trim()) return;

    setImageTitle(input);

    try {
      const start = Date.now();
      const output = await model.generate(input, imageSize, steps);

      if (output.length) {
        setImage(output);
        setGenerationTime(Date.now() - start);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setImageTitle(null);
    } finally {
      setInferenceStepIdx(0);
    }
  };

  if (!model.isReady && !model.error) {
    return (
      <Spinner
        visible={true}
        textContent={`Loading the model ${(model.downloadProgress * 100).toFixed(0)} %`}
      />
    );
  }

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
      }}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {keyboardVisible && <View style={styles.overlay} />}

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <View style={styles.titleContainer}>
          {imageTitle && <Text style={styles.titleText}>{imageTitle}</Text>}
        </View>

        <View style={styles.imageContainer}>
          {model.isGenerating ? (
            <View style={styles.progressContainer}>
              <Text style={styles.text}>Generating...</Text>
              <ProgressBar numSteps={steps} currentStep={inferenceStepIdx} />
            </View>
          ) : (
            <Image
              style={styles.image}
              resizeMode="contain"
              source={
                image?.length
                  ? { uri: `data:image/png;base64,${image}` }
                  : require('../../assets/icons/executorch_logo.png')
              }
            />
          )}
        </View>

        <ModelPicker
          models={MODELS}
          selectedModel={selectedModel}
          disabled={model.isGenerating}
          onSelect={(m) => {
            setSelectedModel(m);
            setImage(null);
            setGenerationTime(null);
          }}
        />

        <View style={styles.stepsRow}>
          <Text style={styles.stepsLabel}>Steps: {steps}</Text>
          <TouchableOpacity
            style={styles.stepButton}
            onPress={() => setSteps((s) => Math.max(5, s - 5))}
          >
            <Text style={styles.stepButtonText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stepButton}
            onPress={() => setSteps((s) => Math.min(50, s + 5))}
          >
            <Text style={styles.stepButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <StatsBar inferenceTime={generationTime} />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter prompt..."
            placeholderTextColor="#aaa"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={runForward}
            returnKeyType="send"
          />
          {model.isGenerating ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={model.interrupt}
            >
              <Ionicons name="stop" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={runForward}
              disabled={!input.trim()}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 0,
  },
  image: {
    width: 256,
    height: 256,
  },
  progressContainer: {
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontSize: 16,
    color: ColorPalette.primary,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  stepsLabel: {
    flex: 1,
    fontSize: 14,
    color: ColorPalette.primary,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: ColorPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 22,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C1C6E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: ColorPalette.primary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: ColorPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
