import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { CrosswordPreset } from '../assets/crossword-data';

interface LevelSelectorProps {
  levels: CrosswordPreset[];
  selectedTemplateId: string;
  onSelectLevel: (id: string) => void;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  levels,
  selectedTemplateId,
  onSelectLevel,
}) => {
  return (
    <View style={styles.presetSelectionBar}>
      <Text style={styles.selectionLabel}>Select Level:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetScroll}
      >
        {levels.map((p, index) => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.presetButton,
              selectedTemplateId === p.id && styles.presetButtonActive,
            ]}
            onPress={() => onSelectLevel(p.id)}
          >
            <Text
              style={[
                styles.presetButtonText,
                selectedTemplateId === p.id && styles.presetButtonTextActive,
              ]}
            >
              Level {index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  presetSelectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fc',
  },
  selectionLabel: {
    paddingLeft: 16,
    paddingRight: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f186e',
  },
  presetScroll: {
    paddingRight: 24,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#d0d5e0',
  },
  presetButtonActive: {
    backgroundColor: '#0f186e',
    borderColor: '#0f186e',
  },
  presetButtonText: {
    fontSize: 14,
    color: '#0f186e',
    fontWeight: '500',
  },
  presetButtonTextActive: {
    color: 'white',
  },
});
