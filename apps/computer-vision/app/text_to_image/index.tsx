import {
  View,
  StyleSheet,
  Text,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import Spinner from '../../components/Spinner';
import { useTextToImage, BK_SDM_TINY_VPRED_256 } from 'react-native-executorch';
import { GeneratingContext } from '../../context';
import ColorPalette from '../../colors';
import ProgressBar from '../../components/ProgressBar';
import { BottomBarWithTextInput } from '../../components/BottomBarWithTextInput';

export default function TextToImageScreen() {
  const [inferenceStepIdx, setInferenceStepIdx] = useState<number>(0);
  const [imageTitle, setImageTitle] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [steps, setSteps] = useState<number>(10);
  const [showTextInput, setShowTextInput] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const imageSize = 224;
  const model = useTextToImage({
    model: BK_SDM_TINY_VPRED_256,
    inferenceCallback: (x) => setInferenceStepIdx(x),
  });

  const { setGlobalGenerating } = useContext(GeneratingContext);

  useEffect(() => {
    setGlobalGenerating(model.isGenerating);
  }, [model.isGenerating, setGlobalGenerating]);

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

  const runForward = async (input: string, numSteps: number) => {
    if (!input || !input.trim()) return;
    const prevImageTitle = imageTitle;
    setImageTitle(input);
    setSteps(numSteps);
    try {
      const output = await model.generate(input, imageSize, steps);
      if (!output.length) {
        setImageTitle(prevImageTitle);
        return;
      }
      setImage(output);
    } catch (e) {
      console.error(e);
      setImageTitle(null);
    } finally {
      setInferenceStepIdx(0);
    }
  };

  if (!model.isReady) {
    // TODO: Update when #614 merged
    return (
      <Spinner
        visible={!model.isReady}
        textContent={`Loading the model ${(model.downloadProgress * 100).toFixed(0)} %`}
      />
    );
  }

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        setShowTextInput(false);
      }}
    >
      <View style={styles.container}>
        {keyboardVisible && <View style={styles.overlay} />}

        <View style={styles.titleContainer}>
          {imageTitle && <Text style={styles.titleText}>{imageTitle}</Text>}
        </View>

        {model.isGenerating ? (
          <View style={styles.progressContainer}>
            <Text style={styles.text}>Generating...</Text>
            <ProgressBar numSteps={steps} currentStep={inferenceStepIdx} />
          </View>
        ) : (
          <View style={styles.imageContainer}>
            {image?.length ? (
              <Image
                style={styles.image}
                source={{ uri: `data:image/png;base64,${image}` }}
              />
            ) : (
              <Image
                style={styles.image}
                source={require('../../assets/icons/executorch_logo.png')}
              />
            )}
          </View>
        )}

        <View style={styles.bottomContainer}>
          <BottomBarWithTextInput
            runModel={runForward}
            stopModel={model.interrupt}
            isGenerating={model.isGenerating}
            isReady={model.isReady}
            showTextInput={showTextInput}
            setShowTextInput={setShowTextInput}
            keyboardVisible={keyboardVisible}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    zIndex: 5,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
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
    color: '#000',
  },
  imageContainer: {
    flex: 1,
    position: 'absolute',
    top: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 256,
    height: 256,
    marginVertical: 30,
    resizeMode: 'contain',
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    flex: 1,
    width: '90%',
    position: 'absolute',
    bottom: 0,
    marginBottom: 25,
    zIndex: 10,
  },
});
