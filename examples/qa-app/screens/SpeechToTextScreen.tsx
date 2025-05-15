import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import SendIcon from '../assets/send_icon.svg';
import { useRef, useState } from 'react';
import { findClosestEmbeddings } from '../utils';
import { DbRow } from '../types';

// const audioStreamOptions = {
//   sampleRate: 16000,
//   channels: 1,
//   bitsPerSample: 16,
//   audioSource: 1,
//   bufferSize: 16000,
// };

// const startStreamingAudio = (options: any, onChunk: (data: string) => void) => {
//   LiveAudioStream.init(options);
//   LiveAudioStream.on('data', onChunk);
//   LiveAudioStream.start();
// };

// const float32ArrayFromPCMBinaryBuffer = (b64EncodedBuffer: string) => {
//   const b64DecodedChunk = Buffer.from(b64EncodedBuffer, 'base64');
//   const int16Array = new Int16Array(b64DecodedChunk.buffer);

//   const float32Array = new Float32Array(int16Array.length);
//   for (let i = 0; i < int16Array.length; i++) {
//     float32Array[i] = Math.max(
//       -1,
//       Math.min(1, (int16Array[i] / audioStreamOptions.bufferSize) * 8)
//     );
//   }
//   return float32Array;
// };

export const MainScreen = ({
  db,
  forward,
}: {
  db: DbRow[];
  forward: (input: string) => Promise<number[]>;
}) => {
  const [userInput, setUserInput] = useState('');
  const textInputRef = useRef<TextInput>(null);

  const sendQuestion = async () => {
    if (db.length > 0) {
      (async () => {
        console.log('query:', userInput);
        const queryEmbedding = await forward(userInput);
        const temp = findClosestEmbeddings(queryEmbedding, db, 3);
        console.log(temp);
      })();
    }
    setUserInput('');
    textInputRef.current?.clear();
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Text>Hi</Text>
      <View>
        <TextInput
          autoCorrect={false}
          style={{
            ...styles.textInput,
          }}
          placeholder="Your message"
          placeholderTextColor={'#C1C6E5'}
          multiline={true}
          ref={textInputRef}
          onChangeText={(text: string) => setUserInput(text)}
        />
        {userInput && (
          <TouchableOpacity
            style={styles.sendChatTouchable}
            onPress={async () => await sendQuestion()}
          >
            <SendIcon height={24} width={24} padding={4} margin={8} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  textInput: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: '75%',
    borderRadius: 20,
  },
  imageContainer: {
    flex: 6,
    width: '100%',
    padding: 16,
  },
  image: {
    flex: 1,
    borderRadius: 8,
    width: '100%',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordingButtonWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    borderWidth: 3,
    borderColor: '#001A72',
    borderRadius: 50,
  },
  recordingButton: {
    paddingVertical: 20,
    backgroundColor: '#001A72',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderRadius: 40,
  },
  topContainer: {
    marginTop: 80,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topContainerText: {
    height: 35,
    fontSize: 30,
    marginTop: 5,
    color: '#001A72',
    fontWeight: '600',
  },
  transcriptionContainer: {
    flex: 5,
    paddingTop: 80,
    width: '90%',
  },
  transcriptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  iconsContainer: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '60%',
  },
  recordingButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  textGreyCenter: {
    color: 'gray',
    textAlign: 'center',
  },
  redText: {
    color: 'red',
  },
  borderGrey: {
    borderColor: 'grey',
  },
  backgroundGrey: {
    backgroundColor: 'grey',
  },
  font13: {
    fontSize: 13,
  },
  borderRed: {
    borderColor: 'rgb(240, 63, 50)',
  },
  backgroundRed: {
    backgroundColor: 'rgb(240, 63, 50)',
  },
  emulatorWarning: {
    color: 'rgb(254, 148, 141)',
    fontSize: 11,
  },
  sendChatTouchable: {
    height: '100%',
    width: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});
