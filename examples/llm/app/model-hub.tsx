import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import ModelCard from '../components/model-hub/ModelCard';
import { useDefaultHeader } from '../hooks/useDefaultHeader';
import { useModelStore } from '../store/modelStore';
import FloatingActionButton from '../components/model-hub/FloatingActionButton';

const ModelHubScreen: React.FC = () => {
  useDefaultHeader();
  const { models } = useModelStore();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Available Models</Text>
      <FlatList
        data={models}
        renderItem={({ item }) => <ModelCard model={item} />}
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
    fontSize: 16,
    marginVertical: 10,
    fontWeight: 'bold',
  },
});
