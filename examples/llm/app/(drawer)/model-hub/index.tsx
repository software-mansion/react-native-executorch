import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import FloatingActionButton from '../../../components/FloatingActionButton';
import ModelCard, { Model } from '../../../components/model-hub/ModelCard';
import {
  updateModelPaths,
  clearModelPaths,
  getAllModels,
} from '../../../database/modelRepository';

const ModelHubScreen: React.FC = () => {
  const db = useSQLiteContext();
  const [availableModels, setAvailableModels] = useState<Model[]>([]);

  const refreshModelsList = useCallback(async () => {
    const models = await getAllModels(db);
    setAvailableModels(models);
  }, [db]);

  useEffect(() => {
    (async () => {
      const models = await getAllModels(db);
      setAvailableModels(models);
    })();

    refreshModelsList();
  }, [db, refreshModelsList]);

  const onModelDownloaded = async (
    modelId: string,
    modelPath: string,
    tokenizerPath: string,
    tokenizerConfigPath: string
  ) => {
    await updateModelPaths(
      db,
      modelId,
      modelPath,
      tokenizerPath,
      tokenizerConfigPath
    );
    await refreshModelsList();
  };

  const onModelRemoved = async (modelId: string) => {
    await clearModelPaths(db, modelId);
    await refreshModelsList();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Available Models</Text>
      <FlatList
        data={availableModels}
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
