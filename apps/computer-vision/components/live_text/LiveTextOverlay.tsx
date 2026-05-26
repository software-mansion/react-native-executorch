import React, { useEffect } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { OCRDetection } from 'react-native-executorch';

const HALO = '#7DD3FC';
const CHIP_BG_TOP = 'rgba(14, 21, 47, 0.94)';
const CHIP_BG_BOTTOM = 'rgba(6, 10, 26, 0.94)';
const STAGGER_MS = 80;

type FrameOrientation = 'up' | 'down' | 'left' | 'right';

type Props = {
  detections: OCRDetection[];
  /** Engine output dimensions (portrait-screen space, sensor H × sensor W). */
  imageSize: { width: number; height: number };
  /** Device orientation used to map portrait-space bboxes into display space. */
  orientation: FrameOrientation;
  canvasSize: { width: number; height: number };
  /** When true, chips run their staggered spring-in on mount. */
  revealActive: boolean;
};

type Bbox = { x1: number; y1: number; x2: number; y2: number };

/**
 * The OCR engine always emits bboxes in portrait-screen coords (range
 * (0, portraitW) × (0, portraitH)). For landscape and upside-down portrait
 * we rotate them into the display's coord space so they line up with the
 * vision-camera preview, which follows `orientationSource="device"`.
 */
function bboxToDisplay(
  bbox: Bbox,
  orient: FrameOrientation,
  portraitW: number,
  portraitH: number
): Bbox {
  switch (orient) {
    case 'left':
      return bbox;
    case 'right':
      return {
        x1: portraitW - bbox.x2,
        y1: portraitH - bbox.y2,
        x2: portraitW - bbox.x1,
        y2: portraitH - bbox.y1,
      };
    case 'up':
      return {
        x1: bbox.y1,
        y1: portraitW - bbox.x2,
        x2: bbox.y2,
        y2: portraitW - bbox.x1,
      };
    case 'down':
      return {
        x1: portraitH - bbox.y2,
        y1: bbox.x1,
        x2: portraitH - bbox.y1,
        y2: bbox.x2,
      };
  }
}

function displayDims(
  orient: FrameOrientation,
  portraitW: number,
  portraitH: number
): { width: number; height: number } {
  if (orient === 'up' || orient === 'down') {
    return { width: portraitH, height: portraitW };
  }
  return { width: portraitW, height: portraitH };
}

type RevealChipProps = {
  rect: { left: number; top: number; width: number; height: number };
  text: string;
  delayMs: number;
  revealActive: boolean;
};

function RevealChip({ rect, text, delayMs, revealActive }: RevealChipProps) {
  const progress = useSharedValue(revealActive ? 0 : 1);
  const halo = useSharedValue(revealActive ? 0 : 0.5);

  useEffect(() => {
    if (!revealActive) return;
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
  }, [delayMs, revealActive, progress, halo]);

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

  // Size the recognized text to fill the box vertically so it reads as an
  // in-place overlay of the original characters. A slightly smaller ratio
  // than the bbox height gives the chip a bit of padding around the glyphs.
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
          {/*
            A UITextView-backed TextInput renders iOS's standard blue
            selection rectangle on long-press. It must be `editable` for
            selection to work; we keep it effectively read-only by ignoring
            any change (the soft keyboard is suppressed via
            showSoftInputOnFocus).
          */}
          <TextInput
            // cspell:disable-next-line
            // Keynote easter-egg: the OCR model recognizes the conference
            // logo as "Appjs"; show it properly as "App.js".
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

export default function LiveTextOverlay({
  detections,
  imageSize,
  orientation,
  canvasSize,
  revealActive,
}: Props) {
  if (!detections.length || imageSize.width <= 0 || imageSize.height <= 0) {
    return null;
  }

  const display = displayDims(orientation, imageSize.width, imageSize.height);
  const scale = Math.max(
    canvasSize.width / display.width,
    canvasSize.height / display.height
  );
  const offsetX = (canvasSize.width - display.width * scale) / 2;
  const offsetY = (canvasSize.height - display.height * scale) / 2;

  const displayBoxes = detections.map((det) => ({
    text: det.text,
    bbox: bboxToDisplay(
      det.bbox,
      orientation,
      imageSize.width,
      imageSize.height
    ),
  }));
  displayBoxes.sort((a, b) => a.bbox.y1 - b.bbox.y1);

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {displayBoxes.map((det, index) => {
        const { x1, y1, x2, y2 } = det.bbox;
        return (
          <RevealChip
            key={`${x1},${y1},${det.text}`}
            rect={{
              left: x1 * scale + offsetX,
              top: y1 * scale + offsetY,
              width: (x2 - x1) * scale,
              height: (y2 - y1) * scale,
            }}
            text={det.text}
            delayMs={index * STAGGER_MS}
            revealActive={revealActive}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Outer wrapper carries the cyan halo. iOS draws shadow outside the
  // layer bounds, but `overflow: 'hidden'` on a single view would clip
  // it — so the inner view does the clipping and rounding while the
  // outer view only owns position + shadow + transform.
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
});
