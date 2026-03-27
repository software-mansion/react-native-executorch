import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
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
  const [dropdownTop, setDropdownTop] = useState(0);
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
        setDropdownTop(pageY);
        setOpen(true);
      }
    );
  };

  const dropdownStylePosition = expandUp
    ? {
        bottom: Dimensions.get('window').height - dropdownTop,
        left: 12,
        right: 12,
      }
    : {
        top: dropdownTop + triggerHeight + 2,
        left: 12,
        right: 12,
      };

  return (
    <>
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
      </View>

      {open && (
        <Modal
          transparent
          visible={open}
          onRequestClose={() => setOpen(false)}
          animationType="none"
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={[styles.dropdown, dropdownStylePosition]}>
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
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
                    activeOpacity={0.7}
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
        </Modal>
      )}
    </>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdown: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#C1C6E5',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: DROPDOWN_MAX_HEIGHT,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
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
