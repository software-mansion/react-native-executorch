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
import { Model } from '../../database/modelRepository';

export default function AddModelModal() {
  const router = useRouter();
  const { addModelToDB } = useModelStore();

  const [remoteModelPath, setRemoteModelPath] = useState<string>('');
  const [remoteTokenizerPath, setRemoteTokenizerPath] = useState<string>('');
  const [remoteTokenizerConfigPath, setRemoteTokenizerConfigPath] =
    useState<string>('');
  const [localModelPath, setLocalModelPath] = useState<string | null>(null);
  const [localTokenizerPath, setLocalTokenizerPath] = useState<string | null>(
    null
  );
  const [localTokenizerConfigPath, setLocalTokenizerConfigPath] = useState<
    string | null
  >(null);

  const pickFile = async (label: string, setPath: (path: string) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (result.canceled || !result.assets[0]?.uri) return;
      const { uri } = result.assets[0];
      setPath(Platform.OS === 'ios' ? uri.replace('file://', '') : uri);
    } catch (err) {
      console.warn(`DocumentPicker error for ${label}:`, err);
    }
  };

  const handleSave = async () => {
    const isRemote = remoteModelPath.length > 0;
    const modelPath = isRemote ? remoteModelPath : `file://${localModelPath}`;
    const tokenizerPath = isRemote
      ? remoteTokenizerPath
      : `file://${localTokenizerPath}`;
    const tokenizerConfigPath = isRemote
      ? remoteTokenizerConfigPath
      : `file://${localTokenizerConfigPath}`;

    if (!modelPath || !tokenizerPath || !tokenizerConfigPath) {
      alert('Please provide all required fields.');
      return;
    }

    const id = `model-${Date.now()}`;
    const model: Model = {
      id,
      isDownloaded: isRemote ? 0 : 1,
      source: isRemote ? 'remote' : 'local',
      modelPath,
      tokenizerPath,
      tokenizerConfigPath,
    };

    await addModelToDB(model);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Remote / External URLs</Text>
      <TextInput
        placeholder="Model URL"
        style={styles.input}
        autoCapitalize="none"
        value={remoteModelPath}
        onChangeText={setRemoteModelPath}
      />
      <TextInput
        placeholder="Tokenizer URL"
        style={styles.input}
        autoCapitalize="none"
        value={remoteTokenizerPath}
        onChangeText={setRemoteTokenizerPath}
      />
      <TextInput
        placeholder="Tokenizer Config URL"
        style={styles.input}
        autoCapitalize="none"
        value={remoteTokenizerConfigPath}
        onChangeText={setRemoteTokenizerConfigPath}
      />

      <Text style={styles.sectionTitle}>Or Select Local Files</Text>
      <TouchableOpacity
        style={styles.fileButton}
        onPress={() => pickFile('Model', (uri) => setLocalModelPath(uri))}
      >
        <Text>
          {localModelPath
            ? `📎 Selected: ${localModelPath.split('/').pop()}`
            : '📂 Choose Model File'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fileButton}
        onPress={() =>
          pickFile('Tokenizer', (uri) => setLocalTokenizerPath(uri))
        }
      >
        <Text>
          {localTokenizerPath
            ? `📎 Selected: ${localTokenizerPath.split('/').pop()}`
            : '📂 Choose Tokenizer File'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fileButton}
        onPress={() =>
          pickFile('Tokenizer Config', (uri) =>
            setLocalTokenizerConfigPath(uri)
          )
        }
      >
        <Text>
          {localTokenizerConfigPath
            ? `📎 Selected: ${localTokenizerConfigPath.split('/').pop()}`
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
