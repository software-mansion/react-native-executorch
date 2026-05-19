import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  variant: 'shutter' | 'again';
  onPress: () => void;
};

export default function ShutterButton({ variant, onPress }: Props) {
  if (variant === 'again') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.againPill, pressed && styles.pressed]}
      >
        <Text style={styles.againText}>Scan again</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.shutterOuter, pressed && styles.pressed]}
    >
      <Pressable
        onPress={onPress}
        style={styles.shutterInner}
        pointerEvents="none"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
  },
  againPill: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  againText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
