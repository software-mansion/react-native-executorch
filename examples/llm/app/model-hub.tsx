import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import ModelCard from '../components/model-hub/ModelCard';
import { useDefaultHeader } from '../hooks/useDefaultHeader';
import { useModelStore } from '../store/modelStore';
import FloatingActionButton from '../components/model-hub/FloatingActionButton';
import ColorPalette from '../colors';

const ModelHubScreen = () => {
  useDefaultHeader();
  const { models } = useModelStore();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Available Models</Text>

      <FlatList
        data={models}
        renderItem={({ item }) => <ModelCard model={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />

      <FloatingActionButton />
    </View>
  );
};

export default ModelHubScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: ColorPalette.primary,
    marginBottom: 16,
  },
});
