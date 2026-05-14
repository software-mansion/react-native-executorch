import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { CrosswordWord } from '../assets/crossword-data';

interface ClueBarProps {
  activeWord: CrosswordWord;
  canToggle: boolean;
  onToggleDirection: () => void;
}

export const ClueBar: React.FC<ClueBarProps> = ({
  activeWord,
  canToggle,
  onToggleDirection,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={canToggle ? 0.7 : 1}
      onPress={onToggleDirection}
      style={styles.clueBar}
    >
      <View style={styles.clueBarBadge}>
        <Text style={styles.clueBarBadgeText}>{activeWord.id}</Text>
      </View>
      <View style={styles.clueBarBody}>
        <Text style={styles.clueBarDirection}>
          {activeWord.direction ? activeWord.direction.toUpperCase() : 'ACROSS'}
        </Text>
        <Text style={styles.clueBarText} numberOfLines={2}>
          {activeWord.clue}
        </Text>
      </View>
      {canToggle && <FontAwesome name="exchange" size={18} color="white" />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  clueBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f186e',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  clueBarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clueBarBadgeText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  clueBarBody: {
    flex: 1,
    marginRight: 8,
  },
  clueBarDirection: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  clueBarText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
});
