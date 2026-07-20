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
        name="vad/index"
        options={{
          drawerLabel: 'Voice Activity Detection',
          title: 'Voice Activity Detection',
        }}
      />
      <Drawer.Screen
        name="stt/index"
        options={{
          drawerLabel: 'Live Transcription (Mic)',
          title: 'Live Transcription (Mic)',
        }}
      />
      <Drawer.Screen
        name="stt-audio/index"
        options={{
          drawerLabel: 'Transcribe Audio File',
          title: 'Transcribe Audio File',
        }}
      />
    </Drawer>
  );
}
