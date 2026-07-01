import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';

export interface VoiceOption<T> {
  /** Display name, e.g. "AF Heart". */
  name: string;
  /** Language code used to pick the flag and shown as a subtitle, e.g. "en-us". */
  lang: string;
  value: T;
}

interface VoicePickerProps<T> {
  label: string;
  options: VoiceOption<T>[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
}

/** Maps a language code to a country flag emoji. */
const FLAGS: Record<string, string> = {
  'en-us': '🇺🇸',
  'en-gb': '🇬🇧',
  'fr': '🇫🇷',
  'es': '🇪🇸',
  'it': '🇮🇹',
  'pt': '🇵🇹',
  'hi': '🇮🇳',
  'pl': '🇵🇱',
  'de': '🇩🇪',
};

const flagFor = (lang: string) => FLAGS[lang] ?? '🏳️';

// Gap left between the bottom of the open list and the screen edge.
const BOTTOM_MARGIN = 24;

type Anchor = { x: number; y: number; width: number; height: number };

export function VoicePicker<T>({
  label,
  options,
  selectedValue,
  onValueChange,
  disabled,
}: VoicePickerProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const [anchor, setAnchor] = useState<Anchor>({ x: 0, y: 0, width: 0, height: 0 });
  const headerRef = useRef<View>(null);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const selected = options.find((option) => option.value === selectedValue);

  const open = () => {
    // Capture the trigger's on-screen position so the dropdown (rendered in a
    // Modal, outside the page ScrollView) can be anchored right below it.
    headerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setExpanded(true);
    });
  };

  const handleSelect = (value: T) => {
    onValueChange(value);
    setExpanded(false);
  };

  // The list opens *over* the trigger (so the selected row isn't shown twice).
  // Cap its height to stay above the bottom safe-area inset / nav bar.
  const listMaxHeight = Math.max(160, windowHeight - anchor.y - insets.bottom - BOTTOM_MARGIN);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Trigger row showing the current selection. */}
      <TouchableOpacity
        ref={headerRef}
        style={[styles.header, disabled && styles.disabled]}
        onPress={() => (expanded ? setExpanded(false) : open())}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{selected ? flagFor(selected.lang) : '🎙️'}</Text>
        <View style={styles.rowText}>
          <Text style={styles.name}>{selected?.name ?? 'Select a voice'}</Text>
          {selected && <Text style={styles.lang}>{selected.lang}</Text>}
        </View>
        <Text style={[styles.chevron, expanded && styles.chevronExpanded]}>⌄</Text>
      </TouchableOpacity>

      <Modal
        visible={expanded}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setExpanded(false)}
      >
        {/* Tap-outside-to-close backdrop. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setExpanded(false)} />

        {/* Dropdown anchored to the trigger, capped to the screen, scrollable. */}
        <View
          style={[
            styles.dropdown,
            {
              top: anchor.y,
              left: anchor.x,
              width: anchor.width,
              maxHeight: listMaxHeight,
            },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator bounces={false}>
            {options.map((option, index) => {
              const isSelected = option.value === selectedValue;
              return (
                <TouchableOpacity
                  key={option.name}
                  style={[
                    styles.row,
                    index === 0 && styles.firstRow,
                    isSelected && styles.rowSelected,
                  ]}
                  onPress={() => handleSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flag}>{flagFor(option.lang)}</Text>
                  <View style={styles.rowText}>
                    <Text style={[styles.name, isSelected && styles.nameSelected]}>
                      {option.name}
                    </Text>
                    <Text style={styles.lang}>{option.lang}</Text>
                  </View>
                  {isSelected && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
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
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
    borderRadius: theme.radius.medium,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.medium,
    gap: theme.spacing.medium,
  },
  disabled: {
    opacity: 0.5,
  },
  rowText: {
    flex: 1,
  },
  flag: {
    fontSize: 24,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  nameSelected: {
    color: theme.colors.primary,
  },
  lang: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  chevron: {
    fontSize: 20,
    color: theme.colors.textMuted,
    marginTop: -6,
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
    marginTop: 0,
    marginBottom: -6,
  },
  dropdown: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.medium,
    overflow: 'hidden',
    backgroundColor: theme.colors.cardBackground,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.medium,
    gap: theme.spacing.medium,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightBorder,
  },
  firstRow: {
    borderTopWidth: 0,
  },
  rowSelected: {
    backgroundColor: '#eef1fb',
  },
  check: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
