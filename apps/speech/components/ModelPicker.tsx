import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

import { theme } from '../theme';

export type ModelOption<T = any> = {
  label: string;
  value: T;
  disabled?: boolean;
};

interface ModelPickerProps<T = any> {
  label: string;
  options: ModelOption<T>[];
  selectedValue: T;
  onValueChange: (value: T) => void;
}

export function ModelPicker<T>({
  label,
  options,
  selectedValue,
  onValueChange,
}: ModelPickerProps<T>) {
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
          const isDisabled = option.disabled;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.chip,
                isSelected && styles.chipActive,
                isDisabled && styles.chipDisabled,
              ]}
              onPress={() => onValueChange(option.value)}
              disabled={isDisabled}
            >
              <Text
                style={[
                  styles.text,
                  isSelected && styles.textActive,
                  isDisabled && styles.textDisabled,
                ]}
              >
                {option.label}
              </Text>
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
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  scroll: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: theme.colors.placeholderBackground,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
  },
  chipDisabled: {
    backgroundColor: theme.colors.placeholderBackground,
    opacity: 0.5,
  },
  text: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  textActive: {
    color: '#fff',
    fontWeight: '600',
  },
  textDisabled: {
    color: theme.colors.textMuted,
  },
});
