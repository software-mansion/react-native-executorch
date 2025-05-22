import React, { useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getChatSettings,
  setChatSettings,
} from '../../../database/chatRepository';
import { useSQLiteContext } from 'expo-sqlite';
import ColorPalette from '../../../colors';

export default function ChatSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = Number(id) || null;
  const db = useSQLiteContext();

  const [systemPrompt, setSystemPrompt] = useState('');
  const [contextWindow, setContextWindow] = useState(6);

  useEffect(() => {
    if (!db || !chatId) return;
    (async () => {
      const settings = await getChatSettings(db, chatId);
      setSystemPrompt(settings.systemPrompt);
      setContextWindow(settings.contextWindow);
    })();
  }, [db, chatId]);

  const handleSave = async () => {
    const newSettings = {
      systemPrompt,
      contextWindow,
    };

    if (chatId === null) {
      await AsyncStorage.setItem(
        'default_chat_settings',
        JSON.stringify(newSettings)
      );
    } else {
      await setChatSettings(db, chatId, newSettings);
    }

    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Chat Settings</Text>

      <Text style={styles.label}>Context Window</Text>
      <TextInput
        style={styles.input}
        value={String(contextWindow)}
        onChangeText={(val) => setContextWindow(Number(val))}
        keyboardType="numeric"
        placeholder="e.g. 6"
      />

      <Text style={styles.label}>System Prompt</Text>
      <TextInput
        style={[styles.input, styles.largeInput]}
        value={systemPrompt}
        onChangeText={setSystemPrompt}
        multiline
        placeholder="e.g. You are a helpful assistant."
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>💾 Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontWeight: '600',
    fontSize: 20,
    marginBottom: 24,
    color: ColorPalette.primary,
  },
  label: {
    fontSize: 15,
    marginTop: 16,
    marginBottom: 6,
    fontWeight: '500',
    color: ColorPalette.blueDark,
  },
  input: {
    borderWidth: 1,
    borderColor: ColorPalette.blueLight,
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: ColorPalette.primary,
  },
  largeInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 30,
    paddingVertical: 14,
    backgroundColor: ColorPalette.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
