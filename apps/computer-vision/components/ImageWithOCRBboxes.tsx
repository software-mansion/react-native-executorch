import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { OCRDetection } from 'react-native-executorch';

const HALO = '#7DD3FC';
const CHIP_BG_TOP = 'rgba(14, 21, 47, 0.94)';
const CHIP_BG_BOTTOM = 'rgba(6, 10, 26, 0.94)';
const STAGGER_MS = 80;
const SCAN_SWEEP_MS = 1600;

interface Props {
  imageUri: string;
  detections: OCRDetection[];
  imageWidth: number;
  imageHeight: number;
  /** When true, draws an animated scan band over the image. */
  isScanning?: boolean;
}

type RevealChipProps = {
  rect: { left: number; top: number; width: number; height: number };
  text: string;
  delayMs: number;
  /** Reveal-resets when this key changes (i.e. a new detection set). */
  revealKey: number;
};

function RevealChip({ rect, text, delayMs, revealKey }: RevealChipProps) {
  const progress = useSharedValue(0);
  const halo = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    halo.value = 0;
    progress.value = withDelay(
      delayMs,
      withSpring(1, { damping: 14, stiffness: 160 })
    );
    halo.value = withDelay(
      delayMs,
      withSequence(
        withTiming(0.85, { duration: 280 }),
        withTiming(0.5, { duration: 420 })
      )
    );
  }, [delayMs, revealKey, progress, halo]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 6 },
      { scale: 0.93 + progress.value * 0.07 },
    ],
    shadowOpacity: halo.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.value, { duration: 160 }),
  }));

  const fontSize = Math.max(10, Math.round(rect.height * 0.66));
  const radius = Math.max(6, Math.round(rect.height * 0.22));

  return (
    <Animated.View
      style={[
        styles.chipOuter,
        {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          borderRadius: radius,
        },
        wrapStyle,
      ]}
    >
      <View style={[styles.chipInner, { borderRadius: radius }]}>
        <LinearGradient
          colors={[CHIP_BG_TOP, CHIP_BG_BOTTOM]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.labelWrap, labelStyle]}>
          {/* UITextView-backed TextInput renders iOS's native blue
            selection rectangle on long-press. */}
          <TextInput
            // cspell:disable-next-line
            value={text === 'Appjs' ? 'App.js' : text}
            onChangeText={() => {}}
            showSoftInputOnFocus={false}
            selectTextOnFocus
            multiline={false}
            scrollEnabled={false}
            caretHidden
            contextMenuHidden={false}
            style={[styles.boxText, { fontSize, lineHeight: fontSize * 1.05 }]}
            allowFontScaling={false}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

type ScanBandProps = { width: number; height: number };

function ScanBand({ width, height }: ScanBandProps) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withRepeat(
      withTiming(1, {
        duration: SCAN_SWEEP_MS,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );
  }, [y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value * height - 110 }],
  }));

  return (
    <Animated.View
      style={[styles.scanBand, { width }, style]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[
          'rgba(125, 211, 252, 0)',
          'rgba(125, 211, 252, 0.25)',
          'rgba(167, 139, 250, 0.55)',
        ]}
        style={styles.scanGlow}
      />
      <LinearGradient
        colors={[
          'rgba(167, 139, 250, 0.9)',
          '#F0F9FF',
          'rgba(125, 211, 252, 0.9)',
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.scanLine}
      />
      <LinearGradient
        colors={[
          'rgba(167, 139, 250, 0.55)',
          'rgba(125, 211, 252, 0.25)',
          'rgba(125, 211, 252, 0)',
        ]}
        style={styles.scanGlow}
      />
    </Animated.View>
  );
}

export default function ImageWithOCRBboxes({
  imageUri,
  detections,
  imageWidth,
  imageHeight,
  isScanning = false,
}: Props) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  // Re-runs the reveal animation whenever a new detection set arrives.
  const revealKey = useRefBumper(detections);

  const { scaleX, scaleY, offsetX, offsetY } = (() => {
    if (!layout.width || !layout.height || !imageWidth || !imageHeight) {
      return { scaleX: 0, scaleY: 0, offsetX: 0, offsetY: 0 };
    }
    const imageRatio = imageWidth / imageHeight;
    const layoutRatio = layout.width / layout.height;
    let sx, sy;
    if (imageRatio > layoutRatio) {
      sx = layout.width / imageWidth;
      sy = layout.width / imageRatio / imageHeight;
    } else {
      sy = layout.height / imageHeight;
      sx = (layout.height * imageRatio) / imageWidth;
    }
    return {
      scaleX: sx,
      scaleY: sy,
      offsetX: (layout.width - imageWidth * sx) / 2,
      offsetY: (layout.height - imageHeight * sy) / 2,
    };
  })();

  // The visible image rect inside the container (after contain-fit).
  const imageRect = {
    left: offsetX,
    top: offsetY,
    width: imageWidth * scaleX,
    height: imageHeight * scaleY,
  };

  const ordered = [...detections].sort((a, b) => a.bbox.y1 - b.bbox.y1);

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setLayout({ width, height });
      }}
    >
      <Image
        style={styles.image}
        resizeMode="contain"
        source={
          imageUri
            ? { uri: imageUri }
            : require('../assets/icons/executorch_logo.png')
        }
      />

      {isScanning && imageRect.width > 0 && imageRect.height > 0 && (
        <View style={[styles.scanClip, imageRect]} pointerEvents="none">
          <ScanBand width={imageRect.width} height={imageRect.height} />
        </View>
      )}

      {!isScanning &&
        ordered.map((det, index) => {
          const { x1, y1, x2, y2 } = det.bbox;
          return (
            <RevealChip
              key={`${revealKey}-${x1},${y1},${det.text}`}
              rect={{
                left: x1 * scaleX + offsetX,
                top: y1 * scaleY + offsetY,
                width: (x2 - x1) * scaleX,
                height: (y2 - y1) * scaleY,
              }}
              text={det.text}
              delayMs={index * STAGGER_MS}
              revealKey={revealKey}
            />
          );
        })}
    </View>
  );
}

/**
 * Returns a key that increments whenever `dep` changes by reference. Lets
 * children remount/restart their animation on a fresh detection set.
 */
function useRefBumper(dep: unknown): number {
  const prevRef = useRef(dep);
  const keyRef = useRef(0);
  if (prevRef.current !== dep) {
    prevRef.current = dep;
    keyRef.current += 1;
  }
  return keyRef.current;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'visible',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  chipOuter: {
    position: 'absolute',
    shadowColor: HALO,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    shadowOpacity: 0.5,
  },
  chipInner: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  labelWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  boxText: {
    color: '#F8FAFF',
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: 'rgba(125, 211, 252, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  scanClip: {
    position: 'absolute',
    overflow: 'hidden',
  },
  scanBand: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'stretch',
  },
  scanGlow: {
    height: 110,
  },
  scanLine: {
    height: 2,
  },
});
