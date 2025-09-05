import Spinner from 'react-native-loading-spinner-overlay';
import { useTextToImage, BK_SDM_TINY_VPRED } from 'react-native-executorch';
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
import { Buffer } from 'buffer';
import { PNG } from 'pngjs/browser';

let imageSize: number = 512;

function arrayToRgba(data: Float32Array): Uint8Array {
  const imageData = new Uint8Array(imageSize * imageSize * 4);
  for (let i = 0; i < imageSize * imageSize; i++) {
    imageData[i * 4 + 0] = data[i * 3 + 0];
    imageData[i * 4 + 1] = data[i * 3 + 1];
    imageData[i * 4 + 2] = data[i * 3 + 2];
    imageData[i * 4 + 3] = 255;
  }
  return imageData;
}

function rgbaToBase64(imageData: Uint8Array): string {
  if (!imageData.length) {
    return '';
  }
  const png = new PNG({ width: imageSize, height: imageSize });
  png.data = Buffer.from(imageData);
  const pngBuffer = PNG.sync.write(png, { colorType: 6 });
  const pngString = pngBuffer.toString('base64');
  return pngString;
}

export default function TextToImageScreen() {
  const model = useTextToImage({ model: BK_SDM_TINY_VPRED });
  imageSize = BK_SDM_TINY_VPRED.imageSize;
  const { setGlobalGenerating } = useContext(GeneratingContext);
  const [prompt, setPrompt] = useState('');
  const [imageUri, setImageUri] = useState<string>('');

  useEffect(() => {
    setGlobalGenerating(model.isGenerating);
  }, [model.isGenerating, setGlobalGenerating]);

  const runForward = async () => {
    if (!prompt.trim()) return;
    try {
      const output = await model.forward(prompt, 5);
      const newUri = rgbaToBase64(arrayToRgba(output));
      setImageUri(newUri);
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
        value={prompt}
        onChangeText={setPrompt}
        editable={!model.isGenerating}
      />
      {imageUri && (
        <View style={styles.imageContainer}>
          <Image
            style={styles.image}
            source={{ uri: `data:image/png;base64,${imageUri}` }}
          />
        </View>
      )}
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
