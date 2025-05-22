import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Divider from '../Divider';
import { Model } from '../../database/modelRepository';
import { useModelStore } from '../../store/modelStore';
import { useLLMStore } from '../../store/llmStore';
import ColorPalette from '../../colors';

interface Props {
  model: Model;
}

const ModelCard = ({ model }: Props) => {
  const { downloadStates, downloadModel, removeModel } = useModelStore();
  const { model: activeModel } = useLLMStore();

  const downloadState = downloadStates[model.id] || {
    progress: 0,
    status: 'not_started',
  };

  const isDownloading = downloadState.status === 'downloading';
  const isLoaded = activeModel?.id === model.id;

  const [isDownloaded, setIsDownloaded] = useState(
    model.isDownloaded === 1 || downloadState.status === 'downloaded'
  );

  useEffect(() => {
    if (downloadState.status === 'downloaded') {
      setIsDownloaded(true);
    }
  }, [downloadState.status]);

  const handlePress = async () => {
    if (isDownloading || isLoaded) return;
    if (isDownloaded) {
      await deleteModel();
    } else {
      await downloadModel(model);
    }
  };

  const deleteModel = async () => {
    try {
      await removeModel(model.id);
      setIsDownloaded(false);
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  };

  const getStatusHint = () => {
    if (isDownloading) return null;
    if (isDownloaded && isLoaded)
      return <Text style={styles.loadedHint}>Model Loaded</Text>;
    if (isDownloaded)
      return <Text style={styles.deleteHint}>Tap to Delete</Text>;

    return <Text style={styles.downloadHint}>Tap to Download</Text>;
  };

  return (
    <TouchableOpacity
      style={[styles.card, isDownloading && styles.disabled]}
      onPress={handlePress}
      disabled={isDownloading}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{model.id}</Text>
        <Text style={styles.sourceText}>
          {model.source === 'remote' ? 'Remote' : 'Local'}
        </Text>
      </View>

      <Divider />

      {getStatusHint()}

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
    borderColor: ColorPalette.blueLight,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
  },
  disabled: {
    opacity: 0.6,
  },
  header: {
    marginBottom: 4,
  },
  name: {
    fontWeight: '600',
    fontSize: 16,
    color: ColorPalette.primary,
  },
  sourceText: {
    fontSize: 12,
    color: ColorPalette.blueDark,
  },
  downloadHint: {
    marginTop: 10,
    textAlign: 'center',
    color: ColorPalette.info,
    fontWeight: '500',
  },
  deleteHint: {
    marginTop: 10,
    textAlign: 'center',
    color: ColorPalette.danger,
    fontWeight: '500',
  },
  loadedHint: {
    marginTop: 10,
    textAlign: 'center',
    color: ColorPalette.success,
    fontWeight: '500',
  },
  progressBarContainer: {
    marginTop: 10,
    height: 12,
    backgroundColor: ColorPalette.blueLight,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: ColorPalette.info,
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: '45%',
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
});
