import { Drawer } from 'expo-router/drawer';
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

import ColorPalette from '../colors';
import React, { useState } from 'react';
import { Text, StyleSheet, View, TouchableOpacity } from 'react-native';

import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import Svg, { Rect } from 'react-native-svg';
import { GeneratingContext } from '../context';

initExecutorch({
  resourceFetcher: ExpoResourceFetcher,
});

function HamburgerIcon({ tintColor }: { tintColor?: string }) {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      style={styles.hamburger}
    >
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Rect
          x={2}
          y={4}
          width={20}
          height={2}
          rx={1}
          fill={tintColor ?? '#000'}
        />
        <Rect
          x={2}
          y={11}
          width={20}
          height={2}
          rx={1}
          fill={tintColor ?? '#000'}
        />
        <Rect
          x={2}
          y={18}
          width={20}
          height={2}
          rx={1}
          fill={tintColor ?? '#000'}
        />
      </Svg>
    </TouchableOpacity>
  );
}

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
          headerLeft: (props) => <HamburgerIcon tintColor={props.tintColor} />,
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
          name="vision_camera/index"
          options={{
            drawerLabel: 'Vision Camera',
            title: 'Vision Camera',
            headerShown: false,
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
        <Drawer.Screen
          name="classification/index"
          options={{
            drawerLabel: 'Classification',
            title: 'Classification',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
        <Drawer.Screen
          name="semantic_segmentation/index"
          options={{
            drawerLabel: 'Semantic Segmentation',
            title: 'Semantic Segmentation',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
        <Drawer.Screen
          name="instance_segmentation/index"
          options={{
            drawerLabel: 'Instance Segmentation',
            title: 'Instance Segmentation',
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
          name="pose_estimation/index"
          options={{
            drawerLabel: 'Pose Estimation',
            title: 'Pose Estimation',
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
          name="text_to_image/index"
          options={{
            drawerLabel: 'Image Generation',
            title: 'Image Generation',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
        <Drawer.Screen
          name="segment_anything/index"
          options={{
            drawerLabel: 'Segment Anything',
            title: 'Segment Anything',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
      </Drawer>
    </GeneratingContext>
  );
}

const styles = StyleSheet.create({
  hamburger: {
    marginLeft: 12,
  },
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
