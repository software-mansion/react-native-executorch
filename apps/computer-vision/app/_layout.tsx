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
          name="classification/index"
          options={{
            drawerLabel: 'Classification',
            title: 'Classification',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
        <Drawer.Screen
          name="image_segmentation/index"
          options={{
            drawerLabel: 'Image Segmentation',
            title: 'Image Segmentation',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
        <Drawer.Screen
          name="object_detection/index"
          options={{
            drawerLabel: 'Object Detection',
            title: 'Object Detection',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
        <Drawer.Screen
          name="ocr/index"
          options={{
            drawerLabel: 'OCR',
            title: 'OCR',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
        <Drawer.Screen
          name="ocr_vertical/index"
          options={{
            drawerLabel: 'OCR Vertical',
            title: 'Vertical OCR',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
        <Drawer.Screen
          name="style_transfer/index"
          options={{
            drawerLabel: 'Style Transfer',
            title: 'Style Transfer',
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
