import React, { useEffect, memo } from 'react';
import { Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useChatStore } from '../store/chatStore';
import ColorPalette from '../colors';

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
      <Section title="App" />
      <DrawerItem
        label="Chat"
        active={pathname === '/'}
        onPress={() => navigate('/')}
      />
      <DrawerItem
        label="Models"
        active={pathname === '/model-hub'}
        onPress={() => navigate('/model-hub')}
      />
      <DrawerItem
        label="Benchmark"
        active={pathname === '/benchmark'}
        onPress={() => navigate('/benchmark')}
      />

      <Section title="Chats" />
      {chats.map((chat) => {
        const path = `/chat/${chat.id}`;
        const active = pathname === path;

        return (
          <DrawerItem
            key={chat.id}
            label={`Chat #${chat.id}`}
            active={active}
            onPress={() => navigate(path)}
          />
        );
      })}
    </ScrollView>
  );
};

export default DrawerMenu;

const DrawerItem = memo(
  ({
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
        style={({ pressed }) => [
          styles.item,
          active && styles.itemActive,
          pressed && styles.itemPressed,
        ]}
      >
        <Text style={[styles.label, active && styles.labelActive]}>
          {label}
        </Text>
      </Pressable>
    );
  }
);

const Section = ({ title }: { title: string }) => (
  <Text style={styles.section}>{title}</Text>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    color: ColorPalette.primary,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  itemActive: {
    backgroundColor: ColorPalette.seaBlueLight,
  },
  itemPressed: {
    backgroundColor: ColorPalette.seaBlueMedium,
  },
  label: {
    fontSize: 16,
    color: ColorPalette.blueDark,
  },
  labelActive: {
    color: ColorPalette.primary,
    fontWeight: 'bold',
  },
});
