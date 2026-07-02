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
    </Drawer>
  );
}
