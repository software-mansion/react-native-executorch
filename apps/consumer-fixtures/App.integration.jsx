import React from 'react';
import { SafeAreaView, Text } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { getApp } from '@react-native-firebase/app';
import { Camera } from 'react-native-vision-camera';
import { AudioContext } from 'react-native-audio-api';
import { tensor } from 'react-native-executorch';

// Referencing each import keeps its JS in the Release bundle. Native modules
// must also autolink and link successfully. This app is build-only.
export default function App() {
  return (
    <SafeAreaView>
      <Text>
        {[tensor, Sentry.init, getApp, Camera, AudioContext]
          .map((value) => typeof value)
          .join(', ')}
      </Text>
    </SafeAreaView>
  );
}
