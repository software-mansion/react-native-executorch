import Spinner from 'react-native-loading-spinner-overlay';
import { useTextToImage, BK_SDM_TINY_VPRED_256 } from 'react-native-executorch';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Image,
  TextInput,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ColorPalette from '../../colors';
import { arrayToRgba, rgbaToBase64 } from './utils';

type InputState =
  | { kind: 'prompt'; value: string }
  | { kind: 'image'; uri: string };

export default function TextToImageScreen() {
  const numSteps = 5;
  const imageSize = BK_SDM_TINY_VPRED_256.imageSize;
  const model = useTextToImage({ model: BK_SDM_TINY_VPRED_256 });

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
    try {
      const output = await model.forward(inputState.value, numSteps);
      const rgbaData = arrayToRgba(output, imageSize);
      const newUri = rgbaToBase64(rgbaData, imageSize);
      setInputState({ kind: 'image', uri: newUri });
    } catch (e) {
      console.error(e);
    }
  };

  if (!model.isReady) {
    return (
      <Spinner
        visible={!model.isReady}
        textContent={`Loading the model ${(model.downloadProgress * 100).toFixed(0)} %`}
      />
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter your prompt..."
        value={inputState.kind === 'prompt' ? inputState.value : ''}
        onChangeText={(text) => setInputState({ kind: 'prompt', value: text })}
        editable={!model.isGenerating}
      />
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
      <Pressable
        style={[
          styles.button,
          (!model.isReady || model.isGenerating) && styles.buttonDisabled,
        ]}
        onPress={runForward}
        disabled={!model.isReady || model.isGenerating}
      >
        <Text style={styles.buttonText}>Generate</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 20,
  },
  button: {
    backgroundColor: ColorPalette.strongPrimary,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
    width: '60%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  image: {
    width: 256,
    height: 256,
    marginVertical: 50,
    resizeMode: 'contain',
  },
  input: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
});
