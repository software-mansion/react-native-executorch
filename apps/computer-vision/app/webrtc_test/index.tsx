import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import {
  RTCView,
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
} from 'react-native-webrtc';
import {
  useWebRTCFrameProcessor,
  configureBackgroundRemoval,
} from 'react-native-executorch-webrtc';
import { SELFIE_SEGMENTATION, ResourceFetcher } from 'react-native-executorch';
import ColorPalette from '../../colors';

export default function WebRTCTest() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [processingResults, setProcessingResults] = useState<string>('');
  const [modelStatus, setModelStatus] = useState<string>('Not loaded');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Download and configure the segmentation model on mount
  useEffect(() => {
    const downloadModel = async () => {
      try {
        setModelStatus('Downloading...');
        const paths = await ResourceFetcher.fetch((progress) => {
          setDownloadProgress(progress);
        }, SELFIE_SEGMENTATION.modelSource);

        if (!paths?.[0]) {
          throw new Error('Failed to download model');
        }

        const modelPath = paths[0];
        console.log('Model downloaded:', modelPath);

        // Configure native WebRTC processor with the model path
        configureBackgroundRemoval(modelPath);
        setModelStatus(`Ready: ${modelPath.split('/').pop()}`);
      } catch (error) {
        console.error('Error downloading model:', error);
        setModelStatus(
          `Error: ${error instanceof Error ? error.message : 'Unknown'}`
        );
      }
    };

    downloadModel();
  }, []);

  // Enable ExecuTorch frame processing on the stream
  useWebRTCFrameProcessor(stream, {
    onResults: (results) => {
      console.log('Frame processing results:', results);
      setProcessingResults(JSON.stringify(results, null, 2));
    },
  });

  // Enumerate available devices
  const enumerateDevices = async () => {
    try {
      const deviceInfos = await mediaDevices.enumerateDevices();
      console.log('Available devices:', deviceInfos);
      setDevices(deviceInfos.filter((d: any) => d.kind === 'videoinput'));
    } catch (error) {
      console.error('Error enumerating devices:', error);
    }
  };

  // Start camera with WebRTC getUserMedia
  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');

      // Enumerate devices before requesting camera
      await enumerateDevices();

      const mediaStream = await mediaDevices.getUserMedia({
        video: {
          facingMode: isFrontCamera ? 'user' : 'environment',
          frameRate: 30,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      console.log('Camera stream obtained:', mediaStream.id);
      console.log('Video tracks:', mediaStream.getVideoTracks().length);

      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        console.log('Video track settings:', videoTrack.getSettings());

        // getCapabilities() is not implemented on Android
        try {
          if (typeof videoTrack.getCapabilities === 'function') {
            console.log(
              'Video track capabilities:',
              videoTrack.getCapabilities()
            );
          }
        } catch (e) {
          console.log('getCapabilities not supported on this platform');
        }
      }

      setStream(mediaStream);
      streamRef.current = mediaStream;
      setCameraStarted(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      Alert.alert(
        'Camera Error',
        `Failed to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Stop camera and release resources
  const stopCamera = () => {
    if (streamRef.current) {
      console.log('Stopping camera...');
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log('Stopped track:', track.kind, track.id);
      });
      setStream(null);
      streamRef.current = null;
      setCameraStarted(false);
    }
  };

  // Switch between front and back camera
  const switchCamera = async () => {
    if (!streamRef.current) return;

    const newFacingMode = isFrontCamera ? 'environment' : 'user';
    console.log('Switching camera to:', newFacingMode);

    // Stop current stream completely
    streamRef.current.getTracks().forEach((track) => {
      track.stop();
    });
    setStream(null);
    streamRef.current = null;

    // Wait for camera to fully release, then start new stream
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const mediaStream = await mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          frameRate: 30,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);
      streamRef.current = mediaStream;
      setIsFrontCamera(!isFrontCamera);
      console.log('Camera switched successfully');
    } catch (error) {
      console.error('Error switching camera:', error);
      setCameraStarted(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopCamera();
      }
    };
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>WebRTC Camera Test</Text>

      <Text style={styles.description}>
        Basic WebRTC camera test using react-native-webrtc's getUserMedia. This
        tests the camera access without any ExecuTorch processing.
      </Text>

      {/* Camera Preview */}
      <View style={styles.videoContainer}>
        {stream ? (
          <RTCView
            streamURL={stream.toURL()}
            style={styles.video}
            objectFit="cover"
            mirror={isFrontCamera}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              {cameraStarted ? 'Starting camera...' : 'Camera not started'}
            </Text>
          </View>
        )}

        {/* Overlay Info */}
        {stream && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>
              Camera: {isFrontCamera ? 'Front' : 'Back'}
            </Text>
            <Text style={styles.overlayText}>
              Stream ID: {stream.id.slice(0, 8)}...
            </Text>
            <Text style={styles.overlayText}>
              Tracks: {stream.getTracks().length}
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, cameraStarted && styles.buttonDisabled]}
          onPress={startCamera}
          disabled={cameraStarted}
        >
          <Text style={styles.buttonText}>Start Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !cameraStarted && styles.buttonDisabled]}
          onPress={stopCamera}
          disabled={!cameraStarted}
        >
          <Text style={styles.buttonText}>Stop Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.switchButton,
            !cameraStarted && styles.buttonDisabled,
          ]}
          onPress={switchCamera}
          disabled={!cameraStarted}
        >
          <Text style={styles.buttonText}>
            Switch to {isFrontCamera ? 'Back' : 'Front'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Model Status */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Segmentation Model:</Text>
        <Text style={styles.infoText}>Status: {modelStatus}</Text>
        {downloadProgress > 0 && downloadProgress < 1 && (
          <Text style={styles.infoText}>
            Progress: {(downloadProgress * 100).toFixed(0)}%
          </Text>
        )}
      </View>

      {/* Stream Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Stream Information:</Text>
        {stream ? (
          <>
            <Text style={styles.infoText}>Stream URL: {stream.toURL()}</Text>
            <Text style={styles.infoText}>
              Active: {stream.active ? 'Yes' : 'No'}
            </Text>
            {stream.getVideoTracks().map((track, idx) => (
              <View key={idx} style={styles.trackInfo}>
                <Text style={styles.infoText}>Track {idx + 1}:</Text>
                <Text style={styles.infoText}> - ID: {track.id}</Text>
                <Text style={styles.infoText}>
                  {' '}
                  - Enabled: {track.enabled ? 'Yes' : 'No'}
                </Text>
                <Text style={styles.infoText}>
                  {' '}
                  - Ready State: {track.readyState}
                </Text>
                <Text style={styles.infoText}> - Label: {track.label}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.infoText}>No active stream</Text>
        )}

        {devices.length > 0 && (
          <View style={styles.trackInfo}>
            <Text style={styles.infoText}>
              Available Cameras: {devices.length}
            </Text>
            {devices.map((device, idx) => (
              <Text key={idx} style={styles.infoText}>
                - {device.label || `Camera ${idx + 1}`} (
                {device.facing || 'unknown'})
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Processing Results */}
      {processingResults && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Frame Processing Results:</Text>
          <Text style={styles.resultsText}>{processingResults}</Text>
        </View>
      )}

      {/* Notes */}
      <View style={styles.notesContainer}>
        <Text style={styles.notesTitle}>Implementation Notes:</Text>
        <Text style={styles.notesText}>
          ✓ Uses mediaDevices.getUserMedia() for camera access
        </Text>
        <Text style={styles.notesText}>
          ✓ Displays stream in RTCView component
        </Text>
        <Text style={styles.notesText}>
          ✓ Uses ExecuTorch frame processor for real-time processing
        </Text>
        <Text style={styles.notesText}>
          ✓ Processes frames at ~10 FPS (every 100ms)
        </Text>
        <Text style={styles.notesText}>
          ✓ Results sent back to JS via event emitter
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ColorPalette.strongPrimary,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  videoContainer: {
    width: '100%',
    height: 500,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
  },
  overlayText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    backgroundColor: ColorPalette.strongPrimary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchButton: {
    backgroundColor: ColorPalette.primary,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: ColorPalette.strongPrimary,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  trackInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  resultsContainer: {
    backgroundColor: '#e6f7ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#91d5ff',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: ColorPalette.strongPrimary,
    marginBottom: 10,
  },
  resultsText: {
    fontSize: 11,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  notesContainer: {
    backgroundColor: '#fff9e6',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffe066',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#996600',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 12,
    color: '#664400',
    marginBottom: 4,
  },
});
