import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  KOKORO_MEDIUM,
  KOKORO_VOICE_AM_SANTA,
  useTextToSpeech,
} from 'react-native-executorch';
import {
  AudioManager,
  AudioContext,
  AudioBuffer,
} from 'react-native-audio-api';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import SWMIcon from '../assets/swm_icon.svg';
import { QUESTIONS } from '../assets/quiz-data';

// Shuffle helper
function shuffleArray<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- Audio Helper ---
const createAudioBufferFromVector = (
  audioVector: Float32Array,
  audioContext: AudioContext | null = null,
  sampleRate: number = 24000
): AudioBuffer => {
  if (audioContext == null) audioContext = new AudioContext({ sampleRate });
  const audioBuffer = audioContext.createBuffer(
    1,
    audioVector.length,
    sampleRate
  );
  const channelData = audioBuffer.getChannelData(0);
  channelData.set(audioVector);
  return audioBuffer;
};

export const Quiz = ({ onBack }: { onBack: () => void }) => {
  // --- Hooks & State ---
  const model = useTextToSpeech({
    model: KOKORO_MEDIUM,
    voice: KOKORO_VOICE_AM_SANTA,
  });

  const [shuffledQuestions] = useState(() => shuffleArray(QUESTIONS));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fadeAnim = useSharedValue(1);
  const feedbackAnim = useSharedValue(0);
  const nextButtonAnim = useSharedValue(0);
  const buttonsInactiveAnim = useSharedValue(1);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<any>(null);
  const isTransitioningRef = useRef(false);
  const autoSpeakRef = useRef(true);

  // Animated Styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackAnim.value,
  }));

  const nextButtonStyle = useAnimatedStyle(() => ({
    opacity: nextButtonAnim.value * buttonsInactiveAnim.value,
    transform: [
      {
        translateY: (1 - nextButtonAnim.value) * 12,
      },
    ],
  }));

  // --- Audio Setup ---
  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['defaultToSpeaker'],
    });

    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current.suspend();

    return () => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  // --- TTS Function ---
  const speak = useCallback(
    async (text: string) => {
      if (!text.trim() || !model.isReady) {
        setIsSpeaking(false);
        return;
      }

      // Stop previous audio if any
      if (currentSourceRef.current) {
        try {
          currentSourceRef.current.stop();
        } catch (e) {}
      }

      setIsSpeaking(true);
      try {
        const audioContext = audioContextRef.current;
        if (!audioContext) return;
        if (audioContext.state === 'suspended') await audioContext.resume();

        const onNext = async (audioVec: Float32Array) => {
          return new Promise<void>((resolve) => {
            const audioBuffer = createAudioBufferFromVector(
              audioVec,
              audioContext,
              24000
            );
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            currentSourceRef.current = source;
            source.onEnded = () => resolve();
            source.start();
          });
        };

        await model.stream({ text, speed: 0.9, onNext, onEnd: async () => {} });
      } catch (e) {
        console.error(e);
      } finally {
        setIsSpeaking(false);
      }
    },
    [model]
  );

  // --- Game Logic ---
  const currentQ = shuffledQuestions[currentIndex];

  // Speak question on load
  useEffect(() => {
    if (!model.isReady) return;
    if (!autoSpeakRef.current) {
      autoSpeakRef.current = true;
      return;
    }
    setIsSpeaking(true);
    const t = setTimeout(() => speak(currentQ.q), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, model.isReady]);

  const handleAnswer = async (index: number) => {
    if (selectedAnswer !== null || isSpeaking) return; // Prevent double taps or clicks while reading

    setSelectedAnswer(index);
    const correct = index === currentQ.c;
    setIsAnswerCorrect(correct);

    // 1. Visual Feedback Animation (1s)
    feedbackAnim.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(1000, withTiming(0, { duration: 200 }))
    );

    // 2. Audio Feedback
    if (correct) {
      await speak('Correct!');
    } else {
      // Play "Incorrect" and explanation as one string
      await speak(`Incorrect. ${currentQ.e}`);
    }

    // 3. Show Next Button
    setShowNext(true);
  };

  const updateQuestionState = (nextIdx: number) => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setCurrentIndex(nextIdx);

    setTimeout(() => {
      isTransitioningRef.current = false;
      fadeAnim.value = withTiming(1, { duration: 500 });
    }, 500);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % shuffledQuestions.length;
    buttonsInactiveAnim.value = 1; // Ensure buttons are active for next round
    autoSpeakRef.current = false;
    speak(shuffledQuestions[nextIdx].q);

    isTransitioningRef.current = true;
    setShowNext(false);

    fadeAnim.value = withTiming(0, { duration: 500 }, (finished) => {
      if (finished) {
        runOnJS(updateQuestionState)(nextIdx);
      }
    });
  };

  const handleLearnMore = async () => {
    if (isSpeaking) return;

    buttonsInactiveAnim.value = withTiming(0.5, { duration: 800 });

    // Play the context for the current question
    await speak(currentQ.context);

    buttonsInactiveAnim.value = withTiming(1, { duration: 800 });
  };

  const getButtonColor = (index: number) => {
    if (selectedAnswer === null) return styles.optionButton;

    if (index === currentQ.c) return styles.correctButton; // Highlight correct answer always if answered
    if (index === selectedAnswer && !isAnswerCorrect) return styles.wrongButton; // Highlight mistake

    return styles.disabledOption;
  };

  // Animate next button appearance
  useEffect(() => {
    nextButtonAnim.value = withTiming(showNext ? 1 : 0, {
      duration: 450,
    });
  }, [showNext, nextButtonAnim]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <FontAwesome name="chevron-left" size={20} color="#0f186e" />
          </TouchableOpacity>
          <SWMIcon width={40} height={40} />
          <Text style={styles.headerText}>Text to Speech - Quiz</Text>
        </View>

        {!model.isReady ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>
              Loading Model: {Math.round(model.downloadProgress * 100)}%
            </Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={styles.flex1}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Animated.View style={[styles.quizContainer, containerStyle]}>
                <View style={styles.questionCard}>
                  <Text style={styles.questionIndex}>
                    Question {currentIndex + 1}
                  </Text>
                  <Text style={styles.questionText}>{currentQ.q}</Text>
                </View>

                <View style={styles.optionsContainer}>
                  {currentQ.a.map((opt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.baseOption, getButtonColor(idx)]}
                      onPress={() => handleAnswer(idx)}
                      disabled={selectedAnswer !== null || isSpeaking}
                    >
                      <Text style={styles.optionText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Feedback Animation Overlay Text */}
                {selectedAnswer !== null && (
                  <Animated.View
                    style={[styles.feedbackContainer, feedbackStyle]}
                  >
                    <Text
                      style={[
                        styles.feedbackText,
                        isAnswerCorrect
                          ? styles.feedbackTextCorrect
                          : styles.feedbackTextIncorrect,
                      ]}
                    >
                      {isAnswerCorrect ? 'Correct!' : 'Incorrect'}
                    </Text>
                  </Animated.View>
                )}
              </Animated.View>
            </ScrollView>

            {showNext && (
              <Animated.View
                style={[styles.bottomContainer, nextButtonStyle]}
                pointerEvents={showNext && !isSpeaking ? 'auto' : 'none'}
              >
                <TouchableOpacity
                  onPress={handleNext}
                  style={styles.nextButton}
                >
                  <Text style={styles.nextButtonText}>Next Question</Text>
                  <FontAwesome name="arrow-right" size={20} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLearnMore}
                  style={[styles.nextButton, styles.learnMoreButton]}
                >
                  <Text
                    style={[styles.nextButtonText, styles.learnMoreButtonText]}
                  >
                    Learn More
                  </Text>
                  <FontAwesome
                    name="graduation-cap"
                    size={20}
                    color="#0f186e"
                  />
                </TouchableOpacity>
              </Animated.View>
            )}
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// Reuse stylistic approach from TextToSpeechScreen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#0f186e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
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
  scrollContent: {
    padding: 20,
    paddingBottom: 160, // Space for bottom container
    flexGrow: 1, // Ensures content scales to screen height
    justifyContent: 'center',
  },
  quizContainer: {
    width: '100%',
  },
  questionCard: {
    backgroundColor: '#0f186e',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    minHeight: 150,
    justifyContent: 'center',
  },
  questionIndex: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  questionText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
  },
  optionsContainer: {
    gap: 12,
  },
  baseOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // States of options
  optionButton: {
    backgroundColor: 'white',
    borderColor: '#e0e0e0',
  },
  correctButton: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  wrongButton: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  disabledOption: {
    backgroundColor: '#f5f5f5',
    borderColor: '#eee',
    opacity: 0.6,
  },

  optionText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  feedbackContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  feedbackText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  feedbackTextCorrect: {
    color: '#4CAF50',
  },
  feedbackTextIncorrect: {
    color: '#F44336',
  },
  nextButton: {
    // Removed marginTop to rely on container padding
    backgroundColor: '#0f186e',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'center',
    width: '100%',
  },
  learnMoreButton: {
    marginTop: 0,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#0f186e',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  learnMoreButtonText: {
    color: '#0f186e',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  flex1: {
    flex: 1,
  },
});
