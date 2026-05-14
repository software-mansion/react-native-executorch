import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { CrosswordWord } from '../assets/crossword-data';

interface QuestionsModalProps {
  visible: boolean;
  words: CrosswordWord[];
  wordStatuses: Record<number, 'correct' | 'incorrect' | 'incomplete'>;
  onClose: () => void;
}

export const QuestionsModal: React.FC<QuestionsModalProps> = ({
  visible,
  words,
  wordStatuses,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandleBar} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Questions</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome
                name="times-circle"
                size={28}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            {words
              .sort((a, b) => a.id - b.id)
              .map((word) => (
                <View
                  key={`${word.id}-${word.direction}`}
                  style={styles.clueRow}
                >
                  <Text
                    style={[
                      styles.clueText,
                      wordStatuses[word.id] === 'correct' && styles.clueCorrect,
                    ]}
                  >
                    <Text style={styles.clueNumber}>{word.id}. </Text>
                    {word.clue}{' '}
                    <Text style={styles.clueDirectionLabel}>
                      ({word.direction === 'across' ? 'Across' : 'Down'})
                    </Text>
                  </Text>
                </View>
              ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  modalSheet: {
    backgroundColor: '#0f186e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  modalHandleBar: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  clueRow: {
    marginBottom: 10,
  },
  clueNumber: {
    fontWeight: 'bold',
  },
  clueText: {
    fontSize: 16,
    color: 'white',
  },
  clueDirectionLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
  },
  clueCorrect: {
    color: '#4CAF50',
    textDecorationLine: 'line-through',
  },
});
