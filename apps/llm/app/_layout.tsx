import { Drawer } from 'expo-router/drawer';
import ColorPalette from '../colors';
import React, { useState } from 'react';
import { Text } from 'react-native';

import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { GeneratingContext } from '../context';

interface CustomDrawerProps extends DrawerContentComponentProps {
  isGenerating: boolean;
}

function CustomDrawerContent(props: CustomDrawerProps) {
  const { isGenerating, ...otherProps } = props;
  return (
    <DrawerContentScrollView {...otherProps}>
      {!isGenerating ? (
        <DrawerItemList {...otherProps} />
      ) : (
        <Text>Model is generating. Interrupt before switching model</Text>
      )}
    </DrawerContentScrollView>
  );
}

export default function _layout() {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <GeneratingContext
      value={{
        setGlobalGenerating: (newState: boolean) => {
          setIsGenerating(newState);
        },
      }}
    >
      <Drawer
        drawerContent={(props) => (
          <CustomDrawerContent {...props} isGenerating={isGenerating} />
        )}
        screenOptions={{
          drawerActiveTintColor: ColorPalette.primary,
          drawerInactiveTintColor: '#888',
          headerTintColor: ColorPalette.primary,
          headerTitleStyle: { color: ColorPalette.primary },
        }}
      >
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
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: () => null,
            drawerItemStyle: { display: 'none' },
          }}
        />
      </Drawer>
    </GeneratingContext>
  );
}
