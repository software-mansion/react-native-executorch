import { Text, StyleSheet, TextInput, Button, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getChatSettings,
  setChatSettings,
} from '../../../database/chatRepository';
import { useSQLiteContext } from 'expo-sqlite';

export default function ChatSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = Number(id) || null;
  const db = useSQLiteContext();

  const [systemPrompt, setSystemPrompt] = useState('');
  const [contextWindow, setContextWindow] = useState(6);

  useEffect(() => {
    (async () => {
      await getChatSettings(db, chatId).then((settings) => {
        setSystemPrompt(settings.systemPrompt);
        setContextWindow(settings.contextWindow);
      });
    })();
  }, [chatId, db]);

  const handleSave = async () => {
    if (chatId === null) {
      await AsyncStorage.setItem(
        'default_chat_settings',
        JSON.stringify({
          systemPrompt: systemPrompt,
          contextWindow: contextWindow,
        })
      );

      router.back();
      return;
    }

    await setChatSettings(db, chatId, {
      systemPrompt: systemPrompt,
      contextWindow: contextWindow,
    });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Context Window</Text>
      <TextInput
        style={styles.input}
        value={String(contextWindow)}
        onChangeText={(val) => setContextWindow(Number(val))}
        keyboardType="numeric"
      />

      <Text style={styles.label}>System Prompt</Text>
      <TextInput
        style={[styles.input, styles.largeInput]}
        value={systemPrompt}
        onChangeText={setSystemPrompt}
        multiline
      />

      <Button title="Save" onPress={handleSave} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  label: {
    fontSize: 16,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    marginTop: 6,
    borderRadius: 4,
  },
  largeInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});
