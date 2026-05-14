import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import SWMIcon from '../assets/swm_icon.svg';
import {
  useTextEmbeddings,
  ALL_MINILM_L6_V2,
  useSpeechToText,
  FSMN_VAD,
  WHISPER_TINY_EN,
  WHISPER_BASE_EN_COREML,
} from 'react-native-executorch';
import { SEMANTLE_DATA, SemantleWord } from '../assets/semantle-data';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import { extractVoiceGuess, cleanText } from '../utils/guessExtractor';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GUESS_WORDS = [
  'WATER',
  'SHIP',
  'BLUE',
  'BEACH',
  'FISH',
  'VACATION',
  'WAVE',
  'ISLAND',
  'SALT',
  'DEEP',
];

interface PopUp {
  id: number;
  x: number;
  y: number;
  anim: Animated.Value;
  rotation: number;
  score: number;
  word: string;
}

const cosineSimilarity = (vecA: Float32Array, vecB: Float32Array) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const getScoreColor = (score: number) => {
  if (score > 80) return '#a32cc4'; // Deep purple for high scores
  if (score > 50) return '#28a745'; // Green
  if (score > 20) return '#fd7e14'; // Orange
  return '#dc3545'; // Red for low similarity
};

export const Semantle = ({ onBack }: { onBack: () => void }) => {
  const [popups, setPopups] = useState<PopUp[]>([]);
  const [currentWordData, setCurrentWordData] = useState<SemantleWord | null>(
    null
  );
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isGuessingMode, setIsGuessingMode] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const isGuessingModeRef = useRef(false);
  const isAnswerRevealedRef = useRef(false);
  const modeAnim = useRef(new Animated.Value(0)).current;
  const [sttText, setSttText] = useState('');
  const secretEmbedding = useRef<Float32Array | null>(null);
  const nextId = useRef(0);
  const isRecordingRef = useRef(false);
  const recorder = useRef(new AudioRecorder());
  const contentFadeAnim = useRef(new Animated.Value(1)).current;

  const { forward, isReady: isEmbeddingsReady } = useTextEmbeddings({
    model: ALL_MINILM_L6_V2,
  });

  const stt = useSpeechToText({
    model: Platform.OS === 'ios' ? WHISPER_BASE_EN_COREML : WHISPER_TINY_EN,
    vad: FSMN_VAD,
  });

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetoothHFP', 'defaultToSpeaker'],
    });

    // Start auto-listening when models are ready
    if (stt.isReady && !isRecordingRef.current) {
      startListening();
    }

    return () => {
      if (isRecordingRef.current) {
        stopListening();
      }
    };
  }, [stt.isReady]);

  useEffect(() => {
    if (isEmbeddingsReady && !currentWordData) {
      const randomWord =
        SEMANTLE_DATA[Math.floor(Math.random() * SEMANTLE_DATA.length)];
      setCurrentWordData(randomWord);
      forward(randomWord.word).then((res) => {
        secretEmbedding.current = res;
      });
    }
  }, [isEmbeddingsReady, forward, currentWordData]);

  const triggerAnimation = useCallback(
    async (wordToGuess: string) => {
      if (!isEmbeddingsReady || !secretEmbedding.current || !currentWordData)
        return;

      const guessEmbedding = await forward(wordToGuess);
      const similarity = cosineSimilarity(
        secretEmbedding.current,
        guessEmbedding
      );

      // Scale similarity (typically 0.1 - 0.9 for non-matches) to 0-100 score
      const score = Math.max(
        0,
        Math.min(100, Math.round((similarity - 0.2) * 150))
      );

      setSessionScores((prev) => [...prev, score]);

      const id = nextId.current++;
      const POPUP_WIDTH = 180;
      const x = Math.random() * (SCREEN_WIDTH - POPUP_WIDTH);
      const y = Math.random() * (SCREEN_HEIGHT - 350) + 150;
      const anim = new Animated.Value(0);
      const rotation = Math.random() * 40 - 20;

      const newPopup: PopUp = {
        id,
        x,
        y,
        anim,
        rotation,
        score,
        word: wordToGuess,
      };
      setPopups((prev) => [...prev, newPopup]);

      Animated.sequence([
        Animated.spring(anim, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.delay(100),
        Animated.timing(anim, {
          toValue: 2,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setPopups((prev) => prev.filter((p) => p.id !== id));
      });
    },
    [isEmbeddingsReady, forward, currentWordData]
  );

  const triggerModeAnimation = useCallback(
    (entering: boolean) => {
      const id = nextId.current++;
      const anim = new Animated.Value(0);

      const newPopup: PopUp = {
        id,
        x: SCREEN_WIDTH / 2 - 90,
        y: SCREEN_HEIGHT / 2 - 100,
        anim,
        rotation: 0,
        score: entering ? 100 : 0,
        word: entering ? 'RAPID FIRE GO!' : 'MODE STOPPED',
      };

      setPopups((prev) => [...prev, newPopup]);

      Animated.parallel([
        Animated.spring(anim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(modeAnim, {
          toValue: entering ? 1 : 0,
          useNativeDriver: false,
        }),
      ]).start(() => {
        Animated.timing(anim, {
          toValue: 2,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setPopups((prev) => prev.filter((p) => p.id !== id));
        });
      });
    },
    [modeAnim]
  );

  const startListening = async () => {
    if (!stt.isReady) return;

    isRecordingRef.current = true;
    setIsVoiceActive(true);

    recorder.current.onAudioReady(
      {
        sampleRate: 16000,
        bufferLength: 1600, // 100ms
        channelCount: 1,
      },
      ({ buffer }) => {
        stt.streamInsert(buffer.getChannelData(0));
      }
    );

    try {
      await AudioManager.setAudioSessionActivity(true);
      recorder.current.start();

      const streamIter = stt.stream({
        timeout: 100,
        useVAD: true,
        vadDetectionMargin: 1000,
      });

      for await (const { committed, nonCommitted } of streamIter) {
        if (!isRecordingRef.current) break;

        const committedText = committed.text || '';
        const nonCommittedText = nonCommitted.text || '';

        // Show both for real-time feedback
        setSttText(`${committedText} ${nonCommittedText}`.trim());

        if (committedText) {
          const rawCleaned = committedText
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .trim();
          const words = rawCleaned.split(/\s+/);

          if (words.includes('start') && !isAnswerRevealedRef.current) {
            isGuessingModeRef.current = true;
            setIsGuessingMode(true);
            triggerModeAnimation(true);
          } else if (words.includes('stop')) {
            isGuessingModeRef.current = false;
            setIsGuessingMode(false);
            triggerModeAnimation(false);
          } else if (words.includes('next') && !isGuessingModeRef.current) {
            nextWord();
          } else if (
            (words.includes('reveal') ||
              (words.includes('show') && words.includes('answer'))) &&
            !isGuessingModeRef.current
          ) {
            setIsAnswerRevealed(true);
            isAnswerRevealedRef.current = true;
          } else if (isGuessingModeRef.current) {
            // In Rapid Fire mode, the entire intelligently cleaned phrase is treated as a single guess
            const intelligentlyCleaned = cleanText(committedText);
            if (intelligentlyCleaned.length > 2) {
              triggerAnimation(intelligentlyCleaned);
            }
          } else {
            // Normal mode: look for "I guess" trigger
            const guess = extractVoiceGuess(committedText);
            if (guess) {
              triggerAnimation(guess);
            }
          }
        }
      }
    } catch (e) {
      console.error('STT Error:', e);
    } finally {
      setIsVoiceActive(false);
    }
  };

  const stopListening = () => {
    isRecordingRef.current = false;
    recorder.current.stop();
    stt.streamStop();
    setIsVoiceActive(false);
  };

  const nextWord = useCallback(() => {
    if (!isEmbeddingsReady) return;

    Animated.timing(contentFadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(async () => {
      setSessionScores([]);
      setIsAnswerRevealed(false);
      isAnswerRevealedRef.current = false;
      const randomWord =
        SEMANTLE_DATA[Math.floor(Math.random() * SEMANTLE_DATA.length)];
      setCurrentWordData(randomWord);
      const res = await forward(randomWord.word);
      secretEmbedding.current = res;

      const id = nextId.current++;
      const anim = new Animated.Value(0);
      const newPopup: PopUp = {
        id,
        x: SCREEN_WIDTH / 2 - 90,
        y: SCREEN_HEIGHT / 2 - 100,
        anim,
        rotation: 0,
        score: 100,
        word: 'NEXT QUESTION',
      };
      setPopups((prev) => [...prev, newPopup]);
      Animated.sequence([
        Animated.spring(anim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 2,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setPopups((prev) => prev.filter((p) => p.id !== id));
      });

      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [isEmbeddingsReady, forward, contentFadeAnim]);

  const isReady = isEmbeddingsReady && stt.isReady;
  const error = stt.error;

  const averageScore =
    sessionScores.length > 0
      ? Math.round(
          sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length
        )
      : 0;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.guessingModeBorder,
            {
              opacity: modeAnim,
              height: modeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 6],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.header,
            isGuessingMode && styles.guessingModeHeader,
            {
              transform: [
                {
                  scale: modeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <FontAwesome
              name="chevron-left"
              size={20}
              color={isGuessingMode ? '#dc3545' : '#0f186e'}
            />
          </TouchableOpacity>
          <SWMIcon
            width={40}
            height={40}
            fill={isGuessingMode ? '#dc3545' : undefined}
          />
          <Text
            style={[
              styles.headerText,
              isGuessingMode && styles.guessingModeHeaderText,
            ]}
          >
            Semantle
          </Text>
        </Animated.View>

        <View style={styles.scoreBar}>
          <View style={styles.scoreCircles}>
            {sessionScores.slice(-5).map((score, index) => (
              <View
                key={`${index}-${score}`}
                style={[
                  styles.scoreCircle,
                  { backgroundColor: getScoreColor(score) },
                ]}
              >
                <Text style={styles.scoreCircleText}>{score}</Text>
              </View>
            ))}
          </View>
          <View style={styles.averageContainer}>
            <Text style={styles.averageLabel}>Avg.</Text>
            <Text
              style={[
                styles.averageValue,
                { color: getScoreColor(averageScore) },
              ]}
            >
              {averageScore}
            </Text>
          </View>
        </View>

        <Animated.View style={[styles.content, { opacity: contentFadeAnim }]}>
          <Text
            style={[
              styles.secretText,
              isGuessingMode && styles.guessingModeText,
            ]}
          >
            {error
              ? `Error: ${error.message}`
              : !isReady
                ? 'Loading models...'
                : isGuessingMode
                  ? 'RAPID FIRE GUESSING MODE ACTIVE'
                  : 'Say "Start" to begin guessing or "I guess..."'}
          </Text>
          {currentWordData && isReady && (
            <View
              style={[
                styles.hintContainer,
                isGuessingMode && styles.guessingModeHint,
              ]}
            >
              <Text
                style={[
                  styles.hintLabel,
                  isGuessingMode && styles.guessingModeText,
                  isAnswerRevealed && styles.answerRevealedLabel,
                ]}
              >
                {isAnswerRevealed ? 'Secret Word:' : 'Hint:'}
              </Text>
              <Text
                style={[
                  styles.hintText,
                  isGuessingMode && styles.guessingModeText,
                  isAnswerRevealed && styles.answerRevealedText,
                ]}
              >
                {isAnswerRevealed ? currentWordData.word : currentWordData.hint}
              </Text>
            </View>
          )}
          {sttText.length > 0 && (
            <Text
              style={[
                styles.transcriptText,
                isGuessingMode && styles.guessingModeTranscript,
              ]}
            >
              {sttText}
            </Text>
          )}
          {!isReady && !error && (
            <ActivityIndicator
              size="large"
              color="#0f186e"
              style={{ marginTop: 20 }}
            />
          )}
        </Animated.View>

        <View style={styles.footer}></View>

        {popups.map((popup) => (
          <Animated.View
            key={popup.id}
            style={[
              styles.popupContainer,
              {
                left: popup.x,
                top: popup.y,
                opacity: popup.anim.interpolate({
                  inputRange: [0, 0.2, 1, 2],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    scale: popup.anim.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [0.3, 1.5, 3],
                    }),
                  },
                  {
                    translateY: popup.anim.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [20, 0, -80],
                    }),
                  },
                  {
                    rotate: `${popup.rotation}deg`,
                  },
                ],
              },
            ]}
          >
            <View style={styles.popupInner}>
              <Text
                style={[
                  styles.popupWordText,
                  { color: getScoreColor(popup.score) },
                ]}
              >
                {popup.word}
              </Text>
              {popup.word !== 'RAPID FIRE GO!' &&
                popup.word !== 'MODE STOPPED' &&
                popup.word !== 'NEXT QUESTION' && (
                  <Text
                    style={[
                      styles.popupText,
                      {
                        color: getScoreColor(popup.score),
                        textShadowColor:
                          popup.score > 80
                            ? 'rgba(163, 44, 196, 0.6)'
                            : 'rgba(0,0,0,0.4)',
                      },
                    ]}
                  >
                    +{popup.score}
                  </Text>
                )}
            </View>
          </Animated.View>
        ))}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  guessingModeContainer: {
    // Keep standard background, use a distinctive border or status bar instead
  },
  guessingModeBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#dc3545',
    zIndex: 2000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  guessingModeHeader: {
    backgroundColor: '#fff5f5',
    elevation: 4,
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    paddingRight: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f186e',
    marginLeft: 10,
  },
  guessingModeHeaderText: {
    color: '#dc3545',
  },
  scoreBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scoreCircles: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  scoreCircleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  averageContainer: {
    alignItems: 'flex-end',
  },
  averageLabel: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  averageValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  secretText: {
    fontSize: 16,
    color: '#0f186e',
    marginBottom: 10,
  },
  guessingModeText: {
    color: '#dc3545', // Use red instead of white since background is now white
  },
  guessingModeTranscript: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  transcriptText: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    color: '#dc3545',
    marginVertical: 10,
    textAlign: 'center',
  },
  hintContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    width: '100%',
  },
  guessingModeHint: {
    backgroundColor: '#fff5f5',
    borderColor: '#feb2b2',
    borderWidth: 2,
  },
  hintLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f186e',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  hintText: {
    fontSize: 18,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  answerRevealedLabel: {
    color: '#28a745',
  },
  answerRevealedText: {
    color: '#28a745',
    fontSize: 24,
    fontWeight: 'bold',
    fontStyle: 'normal',
    textTransform: 'uppercase',
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  roundButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f186e',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  activeVoiceButton: {
    backgroundColor: '#dc3545',
    transform: [{ scale: 1.1 }],
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  popupContainer: {
    position: 'absolute',
    pointerEvents: 'none',
    alignItems: 'center',
    width: 180,
    zIndex: 1000,
  },
  popupInner: {
    alignItems: 'center',
  },
  popupWordText: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  popupText: {
    fontSize: 56,
    fontWeight: '900',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
    fontStyle: 'italic',
    letterSpacing: 2,
  },
});
