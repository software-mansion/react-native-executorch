import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';

export type ModelOption = {
  label: string;
  value: any;
  labels?: any;
};

interface ModelPickerProps {
  label: string;
  options: ModelOption[];
  selectedValue: any;
  onValueChange: (value: any) => void;
}

export function ModelPicker({ label, options, selectedValue, onValueChange }: ModelPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {options.map((option, index) => {
          const isSelected = option.value === selectedValue;
          return (
            <Pressable
              key={index}
              style={[styles.chip, isSelected && styles.activeChip]}
              onPress={() => onValueChange(option.value)}
            >
              <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  scrollContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeChip: {
    backgroundColor: '#000',
  },
  chipText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  activeChipText: {
    color: '#fff',
    fontWeight: '600',
  },
});
