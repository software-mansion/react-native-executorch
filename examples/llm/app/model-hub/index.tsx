import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import FloatingActionButton from '../../components/FloatingActionButton';
import ModelCard from '../../components/model-hub/ModelCard';
import {
  removeModelFiles,
  updateModelDownloaded,
} from '../../database/modelRepository';
import { useDefaultHeader } from '../../hooks/useDefaultHeader';
import { useModelStore } from '../../store/modelStore';

const ModelHubScreen: React.FC = () => {
  useDefaultHeader();
  const { models, loadModels, db } = useModelStore();

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const onModelDownloaded = async (modelId: string) => {
    await updateModelDownloaded(db, modelId);
    await loadModels();
  };

  const onModelRemoved = async (modelId: string) => {
    await removeModelFiles(db, modelId);
    await loadModels();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Available Models</Text>
      <FlatList
        data={models}
        renderItem={({ item }) => (
          <ModelCard
            model={item}
            isDownloaded={item.modelPath !== null}
            onDownloaded={onModelDownloaded}
            onRemoved={onModelRemoved}
          />
        )}
        keyExtractor={(item) => item.id}
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
    paddingBottom: 80,
  },
  heading: {
    fontSize: 20,
    marginVertical: 10,
    fontWeight: 'bold',
  },
});
