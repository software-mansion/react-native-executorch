import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useTextEmbeddings,
  useImageEmbeddings,
  CLIP_VIT_BASE_PATCH_32_TEXT_ENCODER,
  CLIP_VIT_BASE_PATCH_32_IMAGE_ENCODER_MODEL,
} from 'react-native-executorch';
import { launchImageLibrary } from 'react-native-image-picker';
import { useIsFocused } from '@react-navigation/native';

export default function ClipEmbeddingsScreenWrapper() {
  const isFocused = useIsFocused();

  return isFocused ? <ClipEmbeddingsScreen /> : null;
}

function ClipEmbeddingsScreen() {
  const model = useTextEmbeddings({ ...CLIP_VIT_BASE_PATCH_32_TEXT_ENCODER });

  const imageModel = useImageEmbeddings({
    modelSource: CLIP_VIT_BASE_PATCH_32_IMAGE_ENCODER_MODEL,
  });

  const [inputSentence, setInputSentence] = useState('');
  const [sentencesWithEmbeddings, setSentencesWithEmbeddings] = useState<
    { sentence: string; embedding: Float32Array }[]
  >([]);
  const [topMatches, setTopMatches] = useState<
    { sentence: string; similarity: number }[]
  >([]);

  const dotProduct = (a: Float32Array, b: Float32Array) => {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  };

  useEffect(
    () => {
      const computeEmbeddings = async () => {
        if (!model.isReady) return;

        const sentences = [
          'The weather is lovely today.',
          'Night party pictures',
          'Cute animals.',
          'Bike club photos',
        ];

        try {
          const embeddings = [];
          for (const sentence of sentences) {
            const embedding = await model.forward(sentence);
            embeddings.push({ sentence, embedding });
          }
          setSentencesWithEmbeddings(embeddings);
        } catch (error) {
          console.error('Error generating embeddings:', error);
        }
      };

      computeEmbeddings();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model.isReady]
  );

  const checkSimilarities = async () => {
    if (!model.isReady || !inputSentence.trim()) return;

    try {
      const inputEmbedding = await model.forward(inputSentence);
      const matches = sentencesWithEmbeddings.map(
        ({ sentence, embedding }) => ({
          sentence,
          similarity: dotProduct(inputEmbedding, embedding),
        })
      );
      matches.sort((a, b) => b.similarity - a.similarity);
      setTopMatches(matches.slice(0, 3));
    } catch (error) {
      console.error('Error generating embedding:', error);
    }
  };

  const addToSentences = async () => {
    if (!model.isReady || !inputSentence.trim()) return;

    try {
      const embedding = await model.forward(inputSentence);
      setSentencesWithEmbeddings((prev) => [
        ...prev,
        { sentence: inputSentence, embedding },
      ]);
    } catch (error) {
      console.error('Error generating embedding:', error);
    }

    setInputSentence('');
    setTopMatches([]);
  };

  const clearList = async () => {
    if (!model.isReady) return;
    try {
      setSentencesWithEmbeddings([]);
    } catch (error) {
      console.error('Error clearing the list:', error);
    }
  };
  const checkImage = async () => {
    if (!imageModel.isReady) return;

    const output = await launchImageLibrary({ mediaType: 'photo' });

    if (!output.assets || output.assets.length === 0 || !output.assets[0].uri)
      return;

    try {
      // Array.from to get numbers[]
      const inputImageEmbedding = await imageModel.forward(
        output.assets[0].uri
      );

      const matches = sentencesWithEmbeddings.map(
        ({ sentence, embedding }) => ({
          sentence,
          similarity: dotProduct(inputImageEmbedding, embedding),
        })
      );
      matches.sort((a, b) => b.similarity - a.similarity);
      setTopMatches(matches.slice(0, 3));
    } catch (error) {
      console.error('Error generating embedding:', error);
    }
  };

  const getModelStatusText = () => {
    if (model.error || imageModel.error) {
      return `Oops! Error: ${model.error || imageModel.error}`;
    }
    if (!model.isReady || !imageModel.isReady) {
      return `Loading model ${(((model.downloadProgress + imageModel.downloadProgress) / 2) * 100).toFixed(2)}%`;
    }
    return model.isGenerating || imageModel.isGenerating
      ? 'Generating...'
      : 'Model is ready';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.heading}>Text Embeddings Playground</Text>
          <Text style={styles.sectionTitle}>{getModelStatusText()}</Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>List of Existing Sentences</Text>
            {sentencesWithEmbeddings.map((item, index) => (
              <Text key={index} style={styles.sentenceText}>
                - {item.sentence}
              </Text>
            ))}
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Try Your Sentence</Text>
            <TextInput
              placeholder="Type your sentence here..."
              style={styles.input}
              value={inputSentence}
              onChangeText={setInputSentence}
              multiline
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={checkSimilarities}
                style={[
                  styles.buttonPrimary,
                  !inputSentence && styles.buttonDisabled,
                ]}
                disabled={!inputSentence}
              >
                <Ionicons
                  name="search"
                  size={16}
                  color={!inputSentence ? 'gray' : 'white'}
                />
                <Text
                  style={[
                    styles.buttonText,
                    !inputSentence && styles.buttonTextDisabled,
                  ]}
                >
                  Find Similar
                </Text>
              </TouchableOpacity>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  onPress={addToSentences}
                  style={[
                    styles.buttonSecondary,
                    !inputSentence && styles.buttonDisabled,
                  ]}
                  disabled={!inputSentence}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={16}
                    color={!inputSentence ? 'gray' : 'navy'}
                  />
                  <Text
                    style={[
                      styles.buttonTextOutline,
                      !inputSentence && styles.buttonTextDisabled,
                    ]}
                  >
                    Add to List
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={checkImage}
                  style={styles.buttonSecondary}
                >
                  <Text style={styles.buttonTextOutline}>
                    Compare sentences to image
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={clearList}
                  style={[
                    styles.buttonSecondary,
                    sentencesWithEmbeddings.length === 0 &&
                      styles.buttonDisabled,
                  ]}
                  disabled={sentencesWithEmbeddings.length === 0}
                >
                  <Ionicons
                    name="close-outline"
                    size={16}
                    color={
                      sentencesWithEmbeddings.length === 0 ? 'gray' : 'navy'
                    }
                  />
                  <Text
                    style={[
                      styles.buttonTextOutline,
                      sentencesWithEmbeddings.length === 0 &&
                        styles.buttonTextDisabled,
                    ]}
                  >
                    Clear List
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {topMatches.length > 0 && (
              <View style={styles.topMatchesContainer}>
                <Text style={styles.sectionTitle}>Top Matches</Text>
                {topMatches.map((item, index) => (
                  <Text key={index} style={styles.sentenceText}>
                    {item.sentence} ({item.similarity.toFixed(2)})
                  </Text>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
    flexGrow: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 20,
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderColor: '#E2E8F0',
    borderWidth: 2,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
    color: '#1E293B',
  },
  sentenceText: {
    fontSize: 14,
    marginBottom: 6,
    color: '#334155',
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    color: '#0F172A',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: 'navy',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'navy',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#d3d3d3',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonTextOutline: {
    color: 'navy',
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonTextDisabled: {
    color: 'gray',
  },
  topMatchesContainer: {
    marginTop: 20,
  },
  flexContainer: {
    flex: 1,
  },
});
