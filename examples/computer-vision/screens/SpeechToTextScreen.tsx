import { SpeechToTextController } from 'react-native-executorch';
import { Text, View, StyleSheet, Button } from 'react-native';
import { useEffect, useState } from 'react';

export const SpeechToTextScreen = () => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const [model, _] = useState(
    () =>
      new SpeechToTextController({
        transribeCallback: setSequence,
        modelDownloadProgessCallback: setDownloadProgress,
      })
  );

  useEffect(() => {
    const loadModel = async () => {
      await model.loadModel('moonshine');
      console.log('loaded');
    };
    console.log('useEffect');
    loadModel();
  }, [model]);

  return (
    <>
      <View style={styles.imageContainer}>
        <Button
          title="Download"
          onPress={() => model.loadAudio('http://localhost:8080/output.mp3')}
        />
        <Button
          title="Transcribe"
          onPress={async () => await model.transcribe()}
        />
        <Text>{downloadProgress}</Text>
        <Text>{model.decodeSeq(sequence)}</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    flex: 6,
    width: '100%',
    padding: 16,
  },
  image: {
    flex: 1,
    borderRadius: 8,
    width: '100%',
  },
});
