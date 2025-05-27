import ColorPalette from '../colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';

export const BottomBar = ({
  handleCameraPress,
  runForward,
}: {
  handleCameraPress: (isCamera: boolean) => void;
  runForward: () => void;
}) => {
  return (
    <View style={styles.bottomContainer}>
      <View style={styles.bottomIconsContainer}>
        <TouchableOpacity onPress={() => handleCameraPress(false)}>
          <FontAwesome name="photo" size={24} color={ColorPalette.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleCameraPress(true)}>
          <FontAwesome name="camera" size={24} color={ColorPalette.primary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={runForward}>
        <Text style={styles.buttonText}>Run model</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    width: '100%',
    gap: 15,
    alignItems: 'center',
    padding: 16,
    flex: 1,
  },
  bottomIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  button: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ColorPalette.primary,
    color: '#fff',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
