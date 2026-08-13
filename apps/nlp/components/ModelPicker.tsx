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

function hasModelConfig(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.modelPath === 'string') return true;
  for (const key of Object.keys(obj)) {
    if (hasModelConfig(obj[key])) return true;
  }
  return false;
}

function getSubOptions(node: any): { key: string; value: any }[] {
  if (!node || typeof node !== 'object') return [];
  return Object.keys(node)
    .filter((key) => hasModelConfig(node[key]))
    .map((key) => ({ key, value: node[key] }));
}

export function findPath(node: any, target: any, currentPath: string[] = []): string[] | null {
  if (!node || typeof node !== 'object') return null;

  // Search child nodes first to match the deepest leaf node, preventing early returns on parent container objects
  for (const key of Object.keys(node)) {
    if (hasModelConfig(node[key])) {
      const found = findPath(node[key], target, [...currentPath, key]);
      if (found) return found;
    }
  }

  if (node === target) return currentPath;
  if (target && typeof node.modelPath === 'string' && node.modelPath === target.modelPath) {
    return currentPath;
  }

  return null;
}

function getDefaultPath(node: any, currentPath: string[] = []): string[] {
  const subOptions = getSubOptions(node);
  if (subOptions.length === 0) return currentPath;
  const first = subOptions[0]!;
  return getDefaultPath(first.value, [...currentPath, first.key]);
}

function getValueAtPath(registry: any, path: string[]): any {
  let current = registry;
  for (const key of path) {
    if (current && typeof current === 'object') {
      current = current[key];
    } else {
      return null;
    }
  }
  return current;
}

export interface NestedModelPickerProps {
  labelPrefix?: string;
  registry: any;
  selectedValue: any;
  onValueChange: (value: any) => void;
}

export function NestedModelPicker({
  labelPrefix = '',
  registry,
  selectedValue,
  onValueChange,
}: NestedModelPickerProps) {
  const path = findPath(registry, selectedValue) || getDefaultPath(registry);
  const pickers: React.ReactNode[] = [];
  let currentNode = registry;

  for (let i = 0; i <= path.length; i++) {
    const subOptions = getSubOptions(currentNode);
    if (subOptions.length === 0) break;

    const selectedKey = path[i];
    const options = subOptions.map((opt) => ({
      label: opt.key,
      value: opt.key,
    }));

    const label =
      i === 0
        ? `${labelPrefix ? labelPrefix + ' ' : ''}Family`
        : i === 1
          ? `${labelPrefix ? labelPrefix + ' ' : ''}Variant`
          : `${labelPrefix ? labelPrefix + ' ' : ''}Subvariant`;

    const levelIndex = i;
    pickers.push(
      <ModelPicker
        key={levelIndex}
        label={label}
        options={options}
        selectedValue={selectedKey || options[0]?.value}
        onValueChange={(newKey) => {
          const newPath = [...path.slice(0, levelIndex), newKey];
          const newNode = getValueAtPath(registry, newPath);
          const leafPath = [...newPath, ...getDefaultPath(newNode)];
          const leafValue = getValueAtPath(registry, leafPath);
          onValueChange(leafValue);
        }}
      />
    );

    const nextKey = selectedKey || subOptions[0]?.key;
    if (nextKey && currentNode[nextKey]) {
      currentNode = currentNode[nextKey];
    } else {
      break;
    }
  }

  return <View>{pickers}</View>;
}
