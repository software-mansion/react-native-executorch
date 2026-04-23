import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
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

const DROPDOWN_MAX_HEIGHT = 300;

export function ModelPicker<T>({
  models,
  selectedModel,
  onSelect,
  label,
  disabled,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
  });
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
        width: number,
        height: number,
        pageX: number,
        pageY: number
      ) => {
        const spaceBelow = Dimensions.get('window').height - (pageY + height);
        const y =
          spaceBelow >= DROPDOWN_MAX_HEIGHT
            ? pageY + height + 2
            : pageY - Math.min(DROPDOWN_MAX_HEIGHT, models.length * 42) - 2;
        setDropdownLayout({ x: pageX, y, width });
        setOpen(true);
      }
    );
  };

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

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={StyleSheet.absoluteFill}>
            <ScrollView
              style={[
                styles.dropdown,
                {
                  position: 'absolute',
                  top: dropdownLayout.y,
                  left: dropdownLayout.x,
                  width: dropdownLayout.width,
                },
              ]}
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
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 4,
    alignSelf: 'stretch',
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
    borderWidth: 1,
    borderColor: '#C1C6E5',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: DROPDOWN_MAX_HEIGHT,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
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
