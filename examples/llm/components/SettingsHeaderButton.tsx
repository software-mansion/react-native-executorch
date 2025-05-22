import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface Props {
  chatId: number | null;
}

const SettingsHeaderButton = ({ chatId }: Props) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/chat/${chatId}/settings`)}
      style={styles.button}
    >
      <Text style={styles.text}>⚙️</Text>
    </TouchableOpacity>
  );
};

export default React.memo(SettingsHeaderButton);

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 20,
  },
});
