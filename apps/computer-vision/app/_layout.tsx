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
  const fill = tintColor ?? ColorPalette.text;
  return (
    <TouchableOpacity
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      style={styles.hamburger}
    >
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Rect x={2} y={4} width={20} height={2} rx={1} fill={fill} />
        <Rect x={2} y={11} width={20} height={2} rx={1} fill={fill} />
        <Rect x={2} y={18} width={20} height={2} rx={1} fill={fill} />
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
    <DrawerContentScrollView
      {...otherProps}
      style={styles.drawerScroll}
      contentContainerStyle={styles.drawerContent}
    >
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
          drawerActiveTintColor: ColorPalette.accent,
          drawerInactiveTintColor: ColorPalette.textMuted,
          drawerActiveBackgroundColor: 'rgba(125, 211, 252, 0.12)',
          drawerStyle: { backgroundColor: ColorPalette.bg },
          headerStyle: { backgroundColor: ColorPalette.bg },
          headerTintColor: ColorPalette.text,
          headerTitleStyle: {
            color: ColorPalette.text,
            fontWeight: '600',
          },
          headerShadowVisible: false,
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
          }}
        />
        <Drawer.Screen
          name="classification/index"
          options={{ drawerLabel: 'Classification', title: 'Classification' }}
        />
        <Drawer.Screen
          name="semantic_segmentation/index"
          options={{
            drawerLabel: 'Semantic Segmentation',
            title: 'Semantic Segmentation',
          }}
        />
        <Drawer.Screen
          name="instance_segmentation/index"
          options={{
            drawerLabel: 'Instance Segmentation',
            title: 'Instance Segmentation',
          }}
        />
        <Drawer.Screen
          name="object_detection/index"
          options={{
            drawerLabel: 'Object Detection',
            title: 'Object Detection',
          }}
        />
        <Drawer.Screen
          name="pose_estimation/index"
          options={{ drawerLabel: 'Pose Estimation', title: 'Pose Estimation' }}
        />
        <Drawer.Screen
          name="ocr/index"
          options={{ drawerLabel: 'OCR', title: 'OCR' }}
        />
        <Drawer.Screen
          name="ocr_vertical/index"
          options={{ drawerLabel: 'OCR Vertical', title: 'Vertical OCR' }}
        />
        <Drawer.Screen
          name="live_text/index"
          options={{
            drawerLabel: 'Live Text',
            title: 'Live Text',
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="style_transfer/index"
          options={{ drawerLabel: 'Style Transfer', title: 'Style Transfer' }}
        />
        <Drawer.Screen
          name="text_to_image/index"
          options={{
            drawerLabel: 'Image Generation',
            title: 'Image Generation',
          }}
        />
        <Drawer.Screen
          name="segment_anything/index"
          options={{
            drawerLabel: 'Segment Anything',
            title: 'Segment Anything',
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
  drawerScroll: {
    backgroundColor: ColorPalette.bg,
  },
  drawerContent: {
    paddingTop: 8,
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
    color: ColorPalette.text,
  },
  subText: {
    fontSize: 14,
    color: ColorPalette.textMuted,
  },
});
