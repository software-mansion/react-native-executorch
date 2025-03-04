import { useSpeechToText } from 'react-native-executorch';
import { Text, View, StyleSheet, Button } from 'react-native';

export const SpeechToTextScreen = () => {
  const {
    isModelGenerating,
    isModelReady,
    sequence,
    transcribe,
    loadAudio,
    downloadProgress,
  } = useSpeechToText({ modelName: 'moonshine' });

  return (
    <>
      <View style={styles.imageContainer}>
        <Button
          title="Download"
          // onPress={() => loadAudio('http://localhost:8080/output.mp3')}
          onPress={() =>
            loadAudio(
              'https://ai.swmansion.com/storage/moonshine/test_audio.mp3'
            )
          }
        />
        <Button title="Transcribe" onPress={async () => await transcribe()} />
        <Text>downloadProgress: {downloadProgress}</Text>
        <Text>isReady: {isModelReady ? 'ready' : 'not ready'}</Text>
        <Text>
          isGenerating: {isModelGenerating ? 'generating' : 'not generating'}
        </Text>
        <Text>{sequence}</Text>
        <Text>moonshine</Text>
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
