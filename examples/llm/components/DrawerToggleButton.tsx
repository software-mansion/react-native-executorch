import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useDrawer } from '../context/DrawerContext';

export default function DrawerToggleButton() {
  const { openDrawer } = useDrawer();

  return (
    <TouchableOpacity onPress={openDrawer} style={{ paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 20 }}>☰</Text>
    </TouchableOpacity>
  );
}
