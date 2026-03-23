import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export type ModelOption<T> = {
  label: string;
  value: T;
};

type Props<T> = {
  models: ModelOption<T>[];
  selectedModel: T;
  onSelect: (model: T) => void;
  label?: string;
  disabled?: boolean;
};

export function ModelPicker<T>({
  models,
  selectedModel,
  onSelect,
  label,
  disabled,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const selected = models.find((m) => m.value === selectedModel);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => !disabled && setOpen((v) => !v)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        {label && <Text style={styles.label}>{label}</Text>}
        <Text style={styles.triggerText}>{selected?.label ?? '—'}</Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <ScrollView
          style={styles.dropdown}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {models.map((item) => {
            const isSelected = item.value === selectedModel;
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => {
                  onSelect(item.value);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 12, marginVertical: 4, alignSelf: 'stretch' },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C1C6E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  triggerDisabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginRight: 6,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    color: '#001A72',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 10,
    color: '#888',
    marginLeft: 6,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#C1C6E5',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
    marginTop: 2,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionSelected: {
    backgroundColor: '#e8ecf8',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    color: '#001A72',
    fontWeight: '600',
  },
});
