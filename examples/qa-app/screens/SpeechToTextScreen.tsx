import { useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import SWMIcon from '../assets/icons/swm_icon.svg';
import Spinner from 'react-native-loading-spinner-overlay';
import { STREAMING_ACTION, useSpeechToText } from 'react-native-executorch';
import MicIcon from '../assets/icons/mic_icon.svg';
import StopIcon from '../assets/icons/stop_icon.svg';
import LiveAudioStream from 'react-native-live-audio-stream';
import { Buffer } from 'buffer';
import { DbRow } from '../types';
import { findClosestEmbeddings } from '../utils';
import ColorPalette from '../colors';

const audioStreamOptions = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  audioSource: 1,
  bufferSize: 16000,
};

const startStreamingAudio = (options: any, onChunk: (data: string) => void) => {
  LiveAudioStream.init(options);
  LiveAudioStream.on('data', onChunk);
  LiveAudioStream.start();
};

const float32ArrayFromPCMBinaryBuffer = (b64EncodedBuffer: string) => {
  const b64DecodedChunk = Buffer.from(b64EncodedBuffer, 'base64');
  const int16Array = new Int16Array(b64DecodedChunk.buffer);

  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = Math.max(
      -1,
      Math.min(1, (int16Array[i] / audioStreamOptions.bufferSize) * 8)
    );
  }
  return float32Array;
};

export const MainScreen = ({
  db,
  forward,
}: {
  db: DbRow[];
  forward: (input: string) => Promise<number[]>;
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const messageRecorded = useRef<boolean>(false);

  const speechToText = useSpeechToText({
    modelName: 'moonshine',
    windowSize: 3,
    overlapSeconds: 1.2,
  });

  const onChunk = (data: string) => {
    console.log('onChunk');
    const float32Chunk = float32ArrayFromPCMBinaryBuffer(data);
    speechToText.streamingTranscribe(
      STREAMING_ACTION.DATA,
      Array.from(float32Chunk)
    );
  };

  const sendQuestion = async (question: string) => {
    if (db.length > 0) {
      (async () => {
        // console.log('query:', question);
        const queryEmbedding = await forward(question);
        const temp = findClosestEmbeddings(queryEmbedding, db, 3);
        console.log(temp.length);
      })();
    }
  };

  const handleRecordPress = async () => {
    if (isRecording) {
      setIsRecording(false);
      LiveAudioStream.stop();
      messageRecorded.current = true;

      console.log('finishing transcription');
      const question = await speechToText.streamingTranscribe(
        STREAMING_ACTION.STOP
      );
      console.log('transcribed_test:', question);

      await sendQuestion('Who are hobbits?');
    } else {
      console.log('start recording');
      setIsRecording(true);
      startStreamingAudio(audioStreamOptions, onChunk);
      await speechToText.streamingTranscribe(STREAMING_ACTION.START);
    }
  };

  return !speechToText.isReady ? (
    <Spinner
      visible={!speechToText.isReady}
      textContent={`Loading the speech model ${(speechToText.downloadProgress * 100).toFixed(0)}  and semantic search DB`}
    />
  ) : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View>
        <View style={styles.topContainer}>
          <SWMIcon width={45} height={45} />
          <Text style={styles.textModelName}>Qwen 3 x Whisper</Text>
        </View>

        <View style={styles.helloMessageContainer}>
          <Text style={styles.helloText}>Hello! 👋</Text>
          <Text style={styles.bottomHelloText}>What can I help you with?</Text>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={!isRecording ? styles.recordTouchable : styles.recordingInfo}
            onPress={handleRecordPress}
          >
            {isRecording ? (
              <StopIcon height={40} width={40} padding={4} margin={8} />
            ) : (
              <MicIcon height={40} width={40} padding={4} margin={8} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  topContainer: {
    height: 68,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 10,
    width: '100%',
  },
  textModelName: {
    color: ColorPalette.primary,
  },
  helloMessageContainer: {
    flex: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helloText: {
    fontFamily: 'medium',
    fontSize: 30,
    color: ColorPalette.primary,
  },
  bottomHelloText: {
    fontFamily: 'regular',
    fontSize: 20,
    lineHeight: 28,
    color: ColorPalette.primary,
  },
  bottomContainer: {
    height: 100,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  recordTouchable: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// export const MainScreen = ({
//   db,
//   forward,
// }: {
//   db: DbRow[];
//   forward: (input: string) => Promise<number[]>;
// }) => {
//   const [userInput, setUserInput] = useState('');
//   const textInputRef = useRef<TextInput>(null);

//   const sendQuestion = async () => {
//     if (db.length > 0) {
//       (async () => {
//         console.log('query:', userInput);
//         const queryEmbedding = await forward(userInput);
//         const temp = findClosestEmbeddings(queryEmbedding, db, 3);
//         console.log(temp);
//       })();
//     }
//     setUserInput('');
//     textInputRef.current?.clear();
//   };

//   return (
//     <SafeAreaView style={styles.mainContainer}>
//       <Text>Hi</Text>
//       <View>
//         <TextInput
//           autoCorrect={false}
//           style={{
//             ...styles.textInput,
//           }}
//           placeholder="Your message"
//           placeholderTextColor={'#C1C6E5'}
//           multiline={true}
//           ref={textInputRef}
//           onChangeText={(text: string) => setUserInput(text)}
//         />
//         {userInput && (
//           <TouchableOpacity
//             style={styles.sendChatTouchable}
//             onPress={async () => await sendQuestion()}
//           >
//             <SendIcon height={24} width={24} padding={4} margin={8} />
//           </TouchableOpacity>
//         )}
//       </View>
//     </SafeAreaView>
//   );
// };
