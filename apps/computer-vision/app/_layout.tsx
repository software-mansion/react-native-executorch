import { Drawer } from 'expo-router/drawer';
import ColorPalette from '../colors';
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
        name="classification/index"
        options={{
          drawerLabel: 'Classification',
          title: 'Classification',
        }}
      />
      <Drawer.Screen
        name="segmentation/index"
        options={{
          drawerLabel: 'Semantic Segmentation',
          title: 'Semantic Segmentation',
        }}
      />
      <Drawer.Screen
        name="inspect/index"
        options={{
          drawerLabel: 'Model Inspector',
          title: 'Model Inspector',
        }}
      />
    </Drawer>
  );
}
