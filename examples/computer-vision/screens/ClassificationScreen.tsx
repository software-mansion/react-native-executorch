import { useState } from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import { BottomBar } from '../components/BottomBar';
import { getImageUri } from '../utils';
import { useClassification, EFFICIENTNET_V2_S } from 'react-native-executorch';
import { View, StyleSheet, Image, Text, ScrollView } from 'react-native';

export const ClassificationScreen = ({
  imageUri,
  setImageUri,
}: {
  imageUri: string;
  setImageUri: (imageUri: string) => void;
}) => {
  const [results, setResults] = useState<{ label: string; score: number }[]>(
    []
  );

  const model = useClassification({
    modulePath: EFFICIENTNET_V2_S,
  });

  const handleCameraPress = async (isCamera: boolean) => {
    const uri = await getImageUri(isCamera);
    if (typeof uri === 'string') {
      setImageUri(uri as string);
      setResults([]);
    }
  };

  const runForward = async () => {
    if (imageUri) {
      try {
        const output = await model.forward(imageUri);
        const top10 = Object.entries(output)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([label, score]) => ({ label, score }));
        setResults(top10);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!model.isModelReady) {
    return (
      <Spinner
        visible={!model.isModelReady}
        textContent={`Loading the model...`}
      />
    );
  }

  return (
    <>
      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          resizeMode="contain"
          source={
            imageUri
              ? { uri: imageUri }
              : require('../assets/icons/executorch_logo.png')
          }
        />
        {results.length > 0 && (
          <View style={styles.results}>
            <Text style={styles.resultHeader}>Results Top 10</Text>
            <ScrollView style={styles.resultsList}>
              {results.map(({ label, score }) => (
                <View key={label} style={styles.resultRecord}>
                  <Text style={styles.resultLabel}>{label}</Text>
                  <Text>{score.toFixed(3)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      <BottomBar
        handleCameraPress={handleCameraPress}
        runForward={runForward}
      />
    </>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    flex: 6,
    width: '100%',
    padding: 16,
  },
  image: {
    flex: 2,
    borderRadius: 8,
    width: '100%',
  },
  results: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 4,
  },
  resultHeader: {
    fontSize: 18,
    color: 'navy',
  },
  resultsList: {
    flex: 1,
  },
  resultRecord: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 1,
  },
  resultLabel: {
    flex: 1,
    marginRight: 4,
  },
});
