import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export type ModelOption = {
  label: string;
  value: any;
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
        contentContainerStyle={styles.scroll}
      >
        {options.map((option, index) => {
          const isSelected = option.value === selectedValue;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => onValueChange(option.value)}
            >
              <Text style={[styles.text, isSelected && styles.textActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  scroll: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: '#eaeaea',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: '#001A72',
  },
  text: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  textActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
