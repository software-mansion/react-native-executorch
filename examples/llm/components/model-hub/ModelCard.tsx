import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ResourceFetcher } from 'react-native-executorch';
import Divider from '../Divider';

export interface Model {
  id: string;
  source: 'remote' | 'local' | null;
  modelUrl: string;
  tokenizerUrl: string;
  tokenizerConfigUrl: string;
  modelPath?: string | null;
  tokenizerPath?: string | null;
  tokenizerConfigPath?: string | null;
}

interface ModelCardProps {
  model: Model;
  isDownloaded: boolean;
  onDownloaded: (
    modelId: string,
    modelPath: string,
    tokenizerPath: string,
    tokenizerConfigPath: string
  ) => Promise<void>;
  onRemoved: (modelId: string) => Promise<void>;
}

const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isDownloaded,
  onDownloaded,
  onRemoved,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePress = async () => {
    if (downloading) return;
    if (isDownloaded) {
      await deleteModel();
    } else {
      await downloadModel();
    }
  };

  const downloadModel = async () => {
    setDownloading(true);
    setProgress(0);
    try {
      const filePaths = await ResourceFetcher.fetchMultipleResources(
        (p) => setProgress(p),
        model.modelUrl,
        model.tokenizerUrl,
        model.tokenizerConfigUrl
      );
      await onDownloaded(model.id, filePaths[0], filePaths[1], filePaths[2]);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const deleteModel = async () => {
    try {
      await ResourceFetcher.removeMultipleResources(
        model.modelPath,
        model.tokenizerPath,
        model.tokenizerConfigPath
      );
      await onRemoved(model.id);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, downloading && styles.downloading]}
      onPress={handlePress}
      disabled={downloading}
    >
      <Text style={styles.name}>{model.id}</Text>
      <Text style={styles.sourceText}>
        {model.source === 'remote' ? 'Remote' : 'Local'}
      </Text>
      <Divider />
      {!downloading && !isDownloaded && (
        <View style={styles.buttonContainer}>
          <Text style={styles.downloadHint}>Tap to Download</Text>
        </View>
      )}
      {isDownloaded && (
        <View style={styles.buttonContainer}>
          <Text style={styles.deleteHint}>Tap to Delete</Text>
        </View>
      )}
      {downloading && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          <Text style={styles.progressText}>{Math.floor(progress * 100)}%</Text>
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
