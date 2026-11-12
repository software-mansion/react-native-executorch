import React from 'react';
import { SafeAreaView, Text } from 'react-native';
import { tensor } from 'react-native-executorch';

// Release bundling must resolve the published JS entry point and transform
// worklets. This fixture is build coverage; CI does not launch it or run a model.
function buildMarker() {
  'worklet';
  return 'Consumer build';
}

export default function App() {
  return (
    <SafeAreaView>
      <Text>
        {buildMarker()}: {typeof tensor}
      </Text>
    </SafeAreaView>
  );
}
