import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useModelStore } from '../../store/modelStore';
import { ModelEntry } from '../../database/modelRepository';

export default function AddModelModal() {
  const router = useRouter();
  const { addModelToDB } = useModelStore();

  const [modelUrl, setModelUrl] = useState('');
  const [tokenizerUrl, setTokenizerUrl] = useState('');
  const [tokenizerConfigUrl, setTokenizerConfigUrl] = useState('');

  const [modelPath, setModelPath] = useState<string | null>(null);
  const [tokenizerPath, setTokenizerPath] = useState<string | null>(null);
  const [tokenizerConfigPath, setTokenizerConfigPath] = useState<string | null>(
    null
  );

  const pickFile = async (label: string, setPath: (path: string) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      const { uri } = result.assets[0];
      setPath(Platform.OS === 'ios' ? uri.replace('file://', '') : uri);
    } catch (err) {
      console.warn(`DocumentPicker error for ${label}:`, err);
    }
  };

  const isRemote = !!(modelUrl || tokenizerUrl || tokenizerConfigUrl);
  const isLocal = !!(modelPath || tokenizerPath || tokenizerConfigPath);

  const handleSave = async () => {
    if (!isRemote && !isLocal) {
      alert('Please provide at least one file/url.');
      return;
    }

    const id = `model-${Date.now()}`;
    const model: ModelEntry = {
      id,
      source: isRemote ? 'remote' : 'local',
      modelUrl: modelUrl || '',
      tokenizerUrl: tokenizerUrl || '',
      tokenizerConfigUrl: tokenizerConfigUrl || '',
      modelPath,
      tokenizerPath,
      tokenizerConfigPath,
    };

    await addModelToDB(model);
    console.log('Saving model:', model);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Model</Text>

      <Text style={styles.sectionTitle}>Remote / External URLs</Text>
      <TextInput
        placeholder="Model URL"
        style={styles.input}
        autoCapitalize="none"
        value={modelUrl}
        onChangeText={setModelUrl}
      />
      <TextInput
        placeholder="Tokenizer URL"
        style={styles.input}
        autoCapitalize="none"
        value={tokenizerUrl}
        onChangeText={setTokenizerUrl}
      />
      <TextInput
        placeholder="Tokenizer Config URL"
        style={styles.input}
        autoCapitalize="none"
        value={tokenizerConfigUrl}
        onChangeText={setTokenizerConfigUrl}
      />

      <Text style={styles.sectionTitle}>Or Select Local Files</Text>
      <TouchableOpacity
        style={styles.fileButton}
        onPress={() => pickFile('Model', (uri) => setModelPath(uri))}
      >
        <Text>
          {modelPath
            ? `📎 Selected: ${modelPath.split('/').pop()}`
            : '📂 Choose Model File'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fileButton}
        onPress={() => pickFile('Tokenizer', (uri) => setTokenizerPath(uri))}
      >
        <Text>
          {tokenizerPath
            ? `📎 Selected: ${tokenizerPath.split('/').pop()}`
            : '📂 Choose Tokenizer File'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fileButton}
        onPress={() =>
          pickFile('Tokenizer Config', (uri) => setTokenizerConfigPath(uri))
        }
      >
        <Text>
          {tokenizerConfigPath
            ? `📎 Selected: ${tokenizerConfigPath.split('/').pop()}`
            : '📂 Choose Tokenizer Config'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>💾 Save Model</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    marginVertical: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  fileButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 6,
    marginTop: 10,
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#999',
  },
});
