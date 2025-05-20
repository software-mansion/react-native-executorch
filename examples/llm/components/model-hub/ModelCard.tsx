import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ResourceFetcher } from 'react-native-executorch';
import Divider from '../Divider';
import { Model } from '../../database/modelRepository';
import { useModelStore } from '../../store/modelStore';

interface ModelCardProps {
  model: Model;
}

const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
  const { downloadStates, downloadModel, removeModel } = useModelStore();

  const downloadState = downloadStates[model.id] || {
    progress: 0,
    status: 'not_started',
  };

  const isDownloading = downloadState.status === 'downloading';
  const isDownloaded =
    model.isDownloaded === 1 || downloadState.status === 'downloaded';

  const handlePress = async () => {
    if (isDownloading) return;
    if (isDownloaded) {
      await deleteModel();
    } else {
      await downloadModel(model);
    }
  };

  const deleteModel = async () => {
    try {
      if (model.source === 'remote') {
        await ResourceFetcher.removeMultipleResources(
          model.modelPath,
          model.tokenizerPath,
          model.tokenizerConfigPath
        );
      }
      await removeModel(model.id);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, isDownloading && styles.downloading]}
      onPress={handlePress}
      disabled={isDownloading}
    >
      <Text style={styles.name}>{model.id}</Text>
      <Text style={styles.sourceText}>
        {model.source === 'remote' ? 'Remote' : 'Local'}
      </Text>
      <Divider />

      {!isDownloading && !isDownloaded && (
        <View style={styles.buttonContainer}>
          <Text style={styles.downloadHint}>Tap to Download</Text>
        </View>
      )}

      {isDownloaded && (
        <View style={styles.buttonContainer}>
          <Text style={styles.deleteHint}>Tap to Delete</Text>
        </View>
      )}

      {isDownloading && (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${downloadState.progress * 100}%` },
            ]}
          />
          <Text style={styles.progressText}>
            {Math.floor(downloadState.progress * 100)}%
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ModelCard;

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 6,
    marginVertical: 5,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  downloading: {
    opacity: 0.6,
  },
  name: {
    fontWeight: 'bold',
    paddingBottom: 4,
  },
  sourceText: {
    fontSize: 12,
    color: '#666',
  },
  downloadHint: {
    marginTop: 4,
    color: '#007AFF',
    textAlign: 'center',
    width: '100%',
  },
  deleteHint: {
    marginTop: 4,
    color: '#FF3B30',
    textAlign: 'center',
    width: '100%',
  },
  progressBarContainer: {
    marginTop: 8,
    height: 12,
    backgroundColor: '#eee',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: '45%',
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    justifyContent: 'center',
    paddingTop: 10,
  },
});
