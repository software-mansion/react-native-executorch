import { SpeechToTextController } from 'react-native-executorch';
import { Text, View, StyleSheet, Button } from 'react-native';
import { useEffect, useState } from 'react';

export const SpeechToTextScreen = () => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [model, _] = useState(
    () =>
      new SpeechToTextController({
        transribeCallback: setSequence,
      })
  );

  useEffect(() => {
    const loadModel = async () => {
      await model.loadModel('moonshine');
    };
    loadModel();
  }, [model]);

  return (
    <>
      <View style={styles.imageContainer}>
        <Button
          title="Download"
          onPress={() =>
            model.loadAudio(
              'https://ai.swmansion.com/storage/moonshine/test_audio.mp3'
            )
          }
        />
        <Button
          title="Transcribe"
          onPress={async () => await model.transcribe()}
        />
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
