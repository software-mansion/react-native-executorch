import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useTextEmbeddings,
  useImageEmbeddings,
  CLIP_VIT_BASE_PATCH32_TEXT,
  CLIP_VIT_BASE_PATCH32_IMAGE_QUANTIZED,
} from 'react-native-executorch';
import { launchImageLibrary } from 'react-native-image-picker';
import { useIsFocused } from '@react-navigation/native';
import { dotProduct } from '../../utils/math';

const DEFAULT_LABELS = [
  'a photo of a dog',
  'a photo of a cat',
  'a landscape photo',
  'a photo of food',
  'a photo of people',
];

export default function ClipEmbeddingsScreenWrapper() {
  const isFocused = useIsFocused();

  return isFocused ? <ClipEmbeddingsScreen /> : null;
}

function ClipEmbeddingsScreen() {
  const textModel = useTextEmbeddings({ model: CLIP_VIT_BASE_PATCH32_TEXT });
  const imageModel = useImageEmbeddings({
    model: CLIP_VIT_BASE_PATCH32_IMAGE_QUANTIZED,
  });

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [labels, setLabels] = useState<string[]>(DEFAULT_LABELS);
  const [results, setResults] = useState<
    { label: string; similarity: number }[]
  >([]);
  const [imageEmbeddingTime, setImageEmbeddingTime] = useState<number | null>(
    null
  );
  const [textEmbeddingTime, setTextEmbeddingTime] = useState<number | null>(
    null
  );

  const getModelStatusText = (model: typeof textModel | typeof imageModel) => {
    if (model.error) return `Oops! ${model.error}`;
    if (!model.isReady)
      return `Loading ${(model.downloadProgress * 100).toFixed(0)}%`;
    return model.isGenerating ? 'Generating…' : 'Ready';
  };

  const pickImage = async () => {
    const output = await launchImageLibrary({ mediaType: 'photo' });
    if (!output.assets?.[0]?.uri) return;
    setImageUri(output.assets[0].uri);
    setResults([]);
  };

  const classify = async () => {
    if (!imageUri || !imageModel.isReady || !textModel.isReady) return;

    try {
      const imgStart = Date.now();
      const imageEmbedding = await imageModel.forward(imageUri);
      setImageEmbeddingTime(Date.now() - imgStart);

      const txtStart = Date.now();
      const scored: { label: string; similarity: number }[] = [];
      for (const label of labels) {
        const textEmbedding = await textModel.forward(label);
        scored.push({
          label,
          similarity: dotProduct(imageEmbedding, textEmbedding),
        });
      }
      setTextEmbeddingTime(Date.now() - txtStart);

      scored.sort((a, b) => b.similarity - a.similarity);
      setResults(scored);
    } catch (e) {
      console.error('Error during classification:', e);
    }
  };

  const addLabel = () => {
    const trimmed = newLabel.trim();
    if (!trimmed || labels.includes(trimmed)) return;
    setLabels((prev) => [...prev, trimmed]);
    setNewLabel('');
    setResults([]);
  };

  const removeLabel = (label: string) => {
    setLabels((prev) => prev.filter((l) => l !== label));
    setResults((prev) => prev.filter((r) => r.label !== label));
  };

  const modelsReady = textModel.isReady && imageModel.isReady;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>CLIP Image Embeddings</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusText}>
              Text model: {getModelStatusText(textModel)}
            </Text>
            <Text style={styles.statusText}>
              Image model: {getModelStatusText(imageModel)}
            </Text>
          </View>

          {/* Image picker */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={48} color="#94A3B8" />
                <Text style={styles.imagePlaceholderText}>
                  Tap to pick an image
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Classify button */}
          <TouchableOpacity
            style={[
              styles.classifyButton,
              (!imageUri || !modelsReady) && styles.buttonDisabled,
            ]}
            onPress={classify}
            disabled={!imageUri || !modelsReady}
          >
            <Ionicons
              name="sparkles-outline"
              size={18}
              color={imageUri && modelsReady ? 'white' : 'gray'}
            />
            <Text
              style={[
                styles.classifyButtonText,
                (!imageUri || !modelsReady) && styles.buttonTextDisabled,
              ]}
            >
              {!imageUri ? 'Pick an image first' : 'Find best matching label'}
            </Text>
          </TouchableOpacity>

          {/* Results */}
          {results.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Results</Text>
              {results.map((item, index) => (
                <View key={item.label} style={styles.resultRow}>
                  <Text
                    style={[
                      styles.resultLabel,
                      index === 0 && styles.topResultLabel,
                    ]}
                  >
                    {index === 0 ? '🥇 ' : ''}
                    {item.label}
                  </Text>
                  <Text style={styles.resultScore}>
                    {item.similarity.toFixed(3)}
                  </Text>
                </View>
              ))}
              {(imageEmbeddingTime !== null || textEmbeddingTime !== null) && (
                <View style={styles.statsContainer}>
                  {imageEmbeddingTime !== null && (
                    <Text style={styles.statsText}>
                      Image embedding: {imageEmbeddingTime} ms
                    </Text>
                  )}
                  {textEmbeddingTime !== null && (
                    <Text style={styles.statsText}>
                      Text embeddings: {textEmbeddingTime} ms
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Labels */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Text Labels</Text>
            {labels.map((label) => (
              <View key={label} style={styles.labelRow}>
                <Text style={styles.labelText}>{label}</Text>
                <TouchableOpacity onPress={() => removeLabel(label)}>
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addLabelRow}>
              <TextInput
                style={styles.input}
                placeholder="Add a label…"
                value={newLabel}
                onChangeText={setNewLabel}
                onSubmitEditing={addLabel}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[
                  styles.addButton,
                  !newLabel.trim() && styles.buttonDisabled,
                ]}
                onPress={addLabel}
                disabled={!newLabel.trim()}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={newLabel.trim() ? 'white' : 'gray'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  flex: { flex: 1 },
  scrollContainer: { padding: 20, alignItems: 'center', flexGrow: 1 },
  heading: {
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 12,
    color: '#0F172A',
  },
  statusRow: {
    width: '100%',
    marginBottom: 16,
    gap: 2,
  },
  statusText: { fontSize: 13, color: '#64748B' },
  imagePicker: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholderText: { fontSize: 14, color: '#94A3B8' },
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1E293B',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  labelText: { fontSize: 14, color: '#334155', flex: 1 },
  addLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  addButton: {
    backgroundColor: 'navy',
    borderRadius: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classifyButton: {
    width: '100%',
    backgroundColor: 'navy',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  classifyButtonText: { color: 'white', fontWeight: '600', fontSize: 15 },
  buttonDisabled: { backgroundColor: '#f0f0f0', borderColor: '#d3d3d3' },
  buttonTextDisabled: { color: 'gray' },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resultLabel: { fontSize: 14, color: '#334155', flex: 1 },
  topResultLabel: { fontWeight: '700', color: '#0F172A' },
  resultScore: { fontSize: 13, color: '#64748B', marginLeft: 8 },
  statsContainer: { marginTop: 12, gap: 2 },
  statsText: { fontSize: 12, color: '#94A3B8' },
});
