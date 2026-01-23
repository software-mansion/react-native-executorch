import { Drawer } from 'expo-router/drawer';
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from '@rn-executorch/expo-adapter';
import ColorPalette from '../colors';
import React, { useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';

import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { GeneratingContext } from '../context';

initExecutorch({
  resourceFetcher: ExpoResourceFetcher,
});

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
        <View style={styles.centerContent}>
          <Text style={styles.mainText}>Model is generating...</Text>
          <Text style={styles.subText}>Interrupt before switching model</Text>
        </View>
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
          name="text-embeddings/index"
          options={{
            drawerLabel: 'Text embeddings',
            title: 'Text embeddings',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
        <Drawer.Screen
          name="clip-embeddings/index"
          options={{
            drawerLabel: 'CLIP embeddings',
            title: 'CLIP embeddings',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: () => null,
            title: 'Main Menu',
            drawerItemStyle: { display: 'none' },
          }}
        />
      </Drawer>
    </GeneratingContext>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mainText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: ColorPalette.primary,
  },
  subText: {
    fontSize: 14,
    color: ColorPalette.strongPrimary,
  },
});
