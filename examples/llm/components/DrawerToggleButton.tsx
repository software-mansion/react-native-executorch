import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useDrawer } from '../context/DrawerContext';

const DrawerToggleButton = () => {
  const { openDrawer } = useDrawer();

  return (
    <TouchableOpacity onPress={openDrawer} style={styles.button}>
      <Text style={styles.text}>☰</Text>
    </TouchableOpacity>
  );
};

export default React.memo(DrawerToggleButton);

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 20,
  },
});
