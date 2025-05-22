import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { Model } from '../../database/modelRepository';
import { useModelStore } from '../../store/modelStore';
import ColorPalette from '../../colors';

export default function AddModelModal() {
  const router = useRouter();
  const { addModelToDB } = useModelStore();

  const [remoteModelPath, setRemoteModelPath] = useState('');
  const [remoteTokenizerPath, setRemoteTokenizerPath] = useState('');
  const [remoteTokenizerConfigPath, setRemoteTokenizerConfigPath] =
    useState('');

  const [localModelPath, setLocalModelPath] = useState<string | null>(null);
  const [localTokenizerPath, setLocalTokenizerPath] = useState<string | null>(
    null
  );
  const [localTokenizerConfigPath, setLocalTokenizerConfigPath] = useState<
    string | null
  >(null);

  const pickFile = async (label: string, setPath: (uri: string) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });
      if (result.canceled || !result.assets[0]?.uri) return;

      const uri = result.assets[0].uri;
      const normalizedUri =
        Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
      setPath(normalizedUri);
    } catch (err) {
      console.warn(`Error picking file for ${label}:`, err);
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
      Alert.alert('Missing Fields', 'Please provide all necessary paths.');
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>➕ Add New LLM Model</Text>

      <Text style={styles.section}>🌐 Remote Model (URLs)</Text>
      <TextInput
        placeholder="Model URL"
        style={styles.input}
        value={remoteModelPath}
        onChangeText={setRemoteModelPath}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Tokenizer URL"
        style={styles.input}
        value={remoteTokenizerPath}
        onChangeText={setRemoteTokenizerPath}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Tokenizer Config URL"
        style={styles.input}
        value={remoteTokenizerConfigPath}
        onChangeText={setRemoteTokenizerConfigPath}
        autoCapitalize="none"
      />

      <Text style={styles.section}>📁 Local Files (pick from device)</Text>
      <FilePickerButton
        label="Choose Model File"
        selectedPath={localModelPath}
        onPick={() => pickFile('Model', setLocalModelPath)}
      />
      <FilePickerButton
        label="Choose Tokenizer File"
        selectedPath={localTokenizerPath}
        onPick={() => pickFile('Tokenizer', setLocalTokenizerPath)}
      />
      <FilePickerButton
        label="Choose Tokenizer Config File"
        selectedPath={localTokenizerConfigPath}
        onPick={() => pickFile('Tokenizer Config', setLocalTokenizerConfigPath)}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>💾 Save Model</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const FilePickerButton = ({
  label,
  selectedPath,
  onPick,
}: {
  label: string;
  selectedPath: string | null;
  onPick: () => void;
}) => {
  return (
    <TouchableOpacity style={styles.fileButton} onPress={onPick}>
      <Text style={styles.fileButtonText}>
        {selectedPath ? `📎 ${selectedPath.split('/').pop()}` : `📂 ${label}`}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: 'bold',
    color: ColorPalette.primary,
  },
  section: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    color: ColorPalette.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: ColorPalette.blueLight,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
    color: ColorPalette.primary,
  },
  fileButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: ColorPalette.seaBlueDark,
    borderRadius: 6,
    backgroundColor: ColorPalette.seaBlueLight,
    marginBottom: 12,
  },
  fileButtonText: {
    color: ColorPalette.primary,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: ColorPalette.primary,
    padding: 14,
    borderRadius: 6,
    marginTop: 20,
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelText: {
    marginTop: 18,
    textAlign: 'center',
    color: ColorPalette.blueDark,
    fontSize: 14,
  },
});
