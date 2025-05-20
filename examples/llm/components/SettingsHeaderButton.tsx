import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';

type Props = {
  chatId: number | null;
  paddingHorizontal?: number;
};

const SettingsHeaderButton = ({ chatId, paddingHorizontal = 16 }: Props) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/chat/${chatId}/settings`)}
      style={{ paddingHorizontal }}
    >
      <Text>⚙️</Text>
    </TouchableOpacity>
  );
};

export default React.memo(SettingsHeaderButton);
