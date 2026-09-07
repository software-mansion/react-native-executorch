import { Drawer } from 'expo-router/drawer';
import { ColorPalette } from '../theme';
import React from 'react';

export default function Layout() {
  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: ColorPalette.primary,
        drawerInactiveTintColor: '#888',
        headerTintColor: ColorPalette.primary,
        headerTitleStyle: { color: ColorPalette.primary },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: () => null,
          title: 'Main Menu',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="tokenizer/index"
        options={{
          drawerLabel: 'Tokenizer',
          title: 'Tokenizer',
        }}
      />
      <Drawer.Screen
        name="text-embeddings/index"
        options={{
          drawerLabel: 'Text Embeddings',
          title: 'Text Embeddings',
        }}
      />
      <Drawer.Screen
        name="privacy-filter/index"
        options={{
          drawerLabel: 'Privacy Filter',
          title: 'Privacy Filter',
        }}
      />
      <Drawer.Screen
        name="llm/index"
        options={{
          drawerLabel: 'LLM',
          title: 'LLM',
        }}
      />
    </Drawer>
  );
}
