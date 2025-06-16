import { Drawer } from 'expo-router/drawer';
import ColorPalette from '../colors';
import React from 'react';

function DrawerWithScreens() {
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
          drawerLabel: 'Menu',
          title: 'Main Menu',
          headerTitleStyle: { color: ColorPalette.primary },
        }}
      />
      <Drawer.Screen
        name="llm/index"
        options={{
          drawerLabel: 'LLM',
          title: 'LLM',
          headerTitleStyle: { color: ColorPalette.primary },
        }}
      />
      <Drawer.Screen
        name="llm_tool_calling/index"
        options={{
          drawerLabel: 'LLM Tool Calling',
          title: 'LLM Tool Calling',
          headerTitleStyle: { color: ColorPalette.primary },
        }}
      />
      <Drawer.Screen
        name="voice_chat/index"
        options={{
          drawerLabel: 'Voice Chat',
          title: 'Voice Chat',
          headerTitleStyle: { color: ColorPalette.primary },
        }}
      />
    </Drawer>
  );
}

export default function _layout() {
  return <DrawerWithScreens />;
}
