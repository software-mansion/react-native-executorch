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
          drawerActiveTintColor: '#BB86FC',
          drawerInactiveTintColor: '#8B949E',
          headerTintColor: ColorPalette.primary,
          headerTitleStyle: { color: ColorPalette.primary },
          headerLeft: (props) => <HamburgerIcon tintColor={props.tintColor} />,
          drawerContentStyle: { backgroundColor: '#0D1117' },
          drawerLabelStyle: { color: '#E6EDF3' },
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
          name="llm_structured_output/index"
          options={{
            drawerLabel: 'LLM Structured Output',
            title: 'LLM Structured Output',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
        <Drawer.Screen
          name="multimodal_llm/index"
          options={{
            drawerLabel: 'Multimodal LLM (VLM)',
            title: 'Multimodal LLM',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
        <Drawer.Screen
          name="privacy_filter/index"
          options={{
            drawerLabel: 'Privacy Filter (PII)',
            title: 'Privacy Filter',
            headerTitleStyle: { color: ColorPalette.primary },
          }}
        />
        <Drawer.Screen
          name="gemma-x-kokoro/index"
          options={{
            drawerLabel: 'Gemma x Kokoro',
            title: 'Gemma x Kokoro',
            headerStyle: { backgroundColor: '#0D1117' },
            headerTintColor: '#E6EDF3',
            headerTitleStyle: { color: '#E6EDF3', fontSize: 23 },
          }}
        />
      </Drawer>
    </GeneratingContext>
  );
}

const styles = StyleSheet.create({
  hamburger: {
    marginLeft: 20,
    paddingRight: 12,
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
    color: '#E6EDF3',
  },
  subText: {
    fontSize: 14,
    color: '#8B949E',
  },
});
