import React, { useEffect } from 'react';
import { Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useChatStore } from '../store/chatStore';

const DrawerMenu = ({ onNavigate }: { onNavigate: () => void }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { chats, loadChats } = useChatStore();
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const navigate = (path: string) => {
    router.push(path);
    onNavigate();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.section}>App</Text>
      <DrawerItem
        label="Home"
        active={pathname === '/'}
        onPress={() => navigate('/')}
      />
      <DrawerItem
        label="Models"
        active={pathname === '/model-hub'}
        onPress={() => navigate('/model-hub')}
      />

      <Text style={styles.section}>Chats</Text>
      {chats.map((chat) => {
        const path = `/chat/${chat.id}`;
        return (
          <DrawerItem
            key={chat.id}
            label={`Chat #${chat.id}`}
            active={pathname === path}
            onPress={() => navigate(path)}
          />
        );
      })}
    </ScrollView>
  );
};

export default DrawerMenu;

const DrawerItem = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.item, active && styles.activeItem]}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#999',
  },
  item: {
    paddingVertical: 12,
  },
  activeItem: {
    backgroundColor: '#eee',
    borderRadius: 6,
  },
  label: {
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 4,
  },
  activeLabel: {
    color: '#000',
    fontWeight: 'bold',
  },
});
