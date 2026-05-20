import React, { useEffect } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { OCRDetection } from 'react-native-executorch';

const ACCENT = '#FFD60A';
const STAGGER_MS = 70;

type Props = {
  detections: OCRDetection[];
  imageSize: { width: number; height: number };
  canvasSize: { width: number; height: number };
  /** When true, boxes run their staggered spring-in on mount. */
  revealActive: boolean;
};

type RevealBoxProps = {
  rect: { left: number; top: number; width: number; height: number };
  text: string;
  delayMs: number;
  revealActive: boolean;
};

function RevealBox({ rect, text, delayMs, revealActive }: RevealBoxProps) {
  const progress = useSharedValue(revealActive ? 0 : 1);

  useEffect(() => {
    if (!revealActive) return;
    progress.value = withDelay(
      delayMs,
      withSpring(1, { damping: 13, stiffness: 150 })
    );
  }, [delayMs, revealActive, progress]);

  const boxStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.85 + progress.value * 0.15 }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.value, { duration: 120 }),
  }));

  // Size the recognized text to fill the box vertically so it reads as an
  // in-place overlay of the original characters.
  const fontSize = Math.max(10, Math.round(rect.height * 0.72));

  return (
    <Animated.View
      style={[
        styles.boxPosition,
        styles.box,
        {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
        boxStyle,
      ]}
    >
      <Animated.View style={[styles.labelWrap, labelStyle]}>
        {/*
          A non-editable TextInput is UITextView-backed on iOS, so long-press
          shows the standard blue selection rectangle + handles + Copy menu —
          something <Text selectable> doesn't render. Read-only, no caret.
        */}
        <TextInput
          value={text}
          editable={false}
          multiline={false}
          scrollEnabled={false}
          caretHidden
          contextMenuHidden={false}
          style={[styles.boxText, { fontSize, lineHeight: fontSize * 1.05 }]}
          allowFontScaling={false}
        />
      </Animated.View>
    </Animated.View>
  );
}

export default function LiveTextOverlay({
  detections,
  imageSize,
  canvasSize,
  revealActive,
}: Props) {
  const scale = Math.max(
    canvasSize.width / imageSize.width,
    canvasSize.height / imageSize.height
  );
  const offsetX = (canvasSize.width - imageSize.width * scale) / 2;
  const offsetY = (canvasSize.height - imageSize.height * scale) / 2;

  if (!detections.length || imageSize.width <= 0 || imageSize.height <= 0) {
    return null;
  }

  const ordered = [...detections].sort((a, b) => a.bbox.y1 - b.bbox.y1);

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {ordered.map((det, index) => {
        const { x1, y1, x2, y2 } = det.bbox;
        return (
          <RevealBox
            key={`${det.bbox.x1},${det.bbox.y1},${det.text}`}
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
  boxPosition: {
    position: 'absolute',
  },
  box: {
    borderWidth: 1.5,
    borderColor: ACCENT,
    borderRadius: 5,
    // Near-opaque dark fill so the original text behind the box is hidden
    // and only the recognized text reads through.
    backgroundColor: 'rgba(8,10,18,0.94)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  labelWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  boxText: {
    color: ACCENT,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
