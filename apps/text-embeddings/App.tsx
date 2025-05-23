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
  ALL_MINILM_L6_V2,
  ALL_MINILM_L6_V2_TOKENIZER,
} from 'react-native-executorch';

export default function App() {
  const model = useTextEmbeddings({
    modelSource: ALL_MINILM_L6_V2,
    tokenizerSource: ALL_MINILM_L6_V2_TOKENIZER,
  });

  const [inputSentence, setInputSentence] = useState('');
  const [sentencesWithEmbeddings, setSentencesWithEmbeddings] = useState<
    { sentence: string; embedding: number[] }[]
  >([]);
  const [topMatches, setTopMatches] = useState<
    { sentence: string; similarity: number }[]
  >([]);

  const dotProduct = (a: number[], b: number[]) =>
    a.reduce((sum, val, i) => sum + val * b[i], 0);

  useEffect(
    () => {
      const computeEmbeddings = async () => {
        if (!model.isReady) return;

        const sentences = [
          'The weather is lovely today.',
          "It's so sunny outside!",
          'He drove to the stadium.',
        ];

        try {
          const embeddings = await Promise.all(
            sentences.map(async (sentence) => ({
              sentence,
              embedding: await model.forward(sentence),
            }))
          );

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

  const getModelStatusText = () => {
    if (model.error) {
      return `Oops! Error: ${model.error}`;
    }
    if (!model.isReady) {
      return `Loading model ${(model.downloadProgress * 100).toFixed(2)}%`;
    }
    return model.isGenerating ? 'Generating...' : 'Model is ready';
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
            <Text style={styles.sectionTitle}>Existing Sentences</Text>
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

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                onPress={checkSimilarities}
                style={styles.buttonPrimary}
              >
                <Ionicons name="search" size={16} color="white" />
                <Text style={styles.buttonText}> Find Similar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addToSentences}
                style={styles.buttonSecondary}
              >
                <Ionicons name="add-circle-outline" size={16} color="navy" />
                <Text style={styles.buttonTextOutline}> Add to List</Text>
              </TouchableOpacity>
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
  topMatchesContainer: {
    marginTop: 20,
  },
  flexContainer: {
    flex: 1,
  },
});
