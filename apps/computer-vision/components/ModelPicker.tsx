import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

const DROPDOWN_MAX_HEIGHT = 200;

export function ModelPicker<T>({
  models,
  selectedModel,
  onSelect,
  label,
  disabled,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [triggerHeight, setTriggerHeight] = useState(0);
  const [expandUp, setExpandUp] = useState(false);
  const triggerRef = useRef<React.ComponentRef<typeof TouchableOpacity>>(null);
  const selected = models.find((m) => m.value === selectedModel);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const handlePress = () => {
    if (disabled) return;
    if (open) {
      setOpen(false);
      return;
    }
    triggerRef.current?.measure(
      (
        _x: number,
        _y: number,
        _width: number,
        height: number,
        _pageX: number,
        pageY: number
      ) => {
        setTriggerHeight(height);
        const spaceBelow = Dimensions.get('window').height - (pageY + height);
        setExpandUp(spaceBelow < DROPDOWN_MAX_HEIGHT);
        setOpen(true);
      }
    );
  };

  const dropdownPosition = expandUp
    ? { bottom: triggerHeight + 2 }
    : { top: triggerHeight + 2 };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        ref={triggerRef}
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={handlePress}
        activeOpacity={disabled ? 1 : 0.7}
      >
        {label && <Text style={styles.label}>{label}</Text>}
        <Text style={styles.triggerText}>{selected?.label ?? '—'}</Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <ScrollView
          style={[styles.dropdown, dropdownPosition]}
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
  container: {
    marginHorizontal: 12,
    marginVertical: 4,
    alignSelf: 'stretch',
    zIndex: 100,
  },
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
    position: 'absolute',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#C1C6E5',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: DROPDOWN_MAX_HEIGHT,
    zIndex: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
