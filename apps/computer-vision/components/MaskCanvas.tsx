import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  Canvas,
  Path,
  Skia,
  PaintStyle,
  StrokeCap,
  StrokeJoin,
  type SkImage,
  type SkPath,
} from '@shopify/react-native-skia';

import { skImageToBuffer } from '../utils';

/** A 2D point in the image's pixel coordinates. */
export type MaskPoint = { readonly x: number; readonly y: number };

/** One brush stroke over the image, in the image's pixel coordinates. */
export type MaskStroke = {
  readonly points: readonly MaskPoint[];
  /** Brush diameter in image pixels. */
  readonly width: number;
};

export interface MaskCanvasProps {
  /** The image the strokes are painted over; sets the coordinate space. */
  image: SkImage;
  strokes: readonly MaskStroke[];
  onStrokesChange: (strokes: readonly MaskStroke[]) => void;
  /** Brush diameter in image pixels for new strokes. */
  brushWidth: number;
  /** When false the strokes are shown but cannot be edited. */
  enabled?: boolean;
  color?: string;
}

/**
 * The contain-fit transform `ImageViewport` draws the image with, so strokes
 * land where the finger is.
 * @param view - The canvas size in view points.
 * @param image - The image size in pixels.
 * @returns The scale and offset mapping image pixels to view points.
 */
const containFit = (
  view: { width: number; height: number },
  image: { width: number; height: number }
) => {
  const scale = Math.min(view.width / image.width, view.height / image.height);
  const dx = (view.width - image.width * scale) / 2;
  const dy = (view.height - image.height * scale) / 2;
  return { scale, dx, dy };
};

const strokePath = (stroke: MaskStroke, transform: (p: MaskPoint) => MaskPoint): SkPath => {
  const builder = Skia.PathBuilder.Make();
  const first = transform(stroke.points[0]!);
  builder.moveTo(first.x, first.y);
  // A single tap still leaves a round dot thanks to the round cap.
  if (stroke.points.length === 1) builder.lineTo(first.x, first.y);
  for (let i = 1; i < stroke.points.length; i++) {
    const p = transform(stroke.points[i]!);
    builder.lineTo(p.x, p.y);
  }
  return builder.build();
};

// A paint-over layer for `ImageViewport`: fills its parent, converts pan
// gestures into brush strokes in image pixels, and shows them as a translucent
// overlay. Render the strokes into a mask with `rasterizeMask`.
export function MaskCanvas({
  image,
  strokes,
  onStrokesChange,
  brushWidth,
  enabled = true,
  color = 'rgba(255, 64, 64, 0.55)',
}: MaskCanvasProps) {
  const [view, setView] = useState({ width: 0, height: 0 });
  // The stroke being drawn lives in a ref so each move appends in place and
  // only the committed list goes through props.
  const current = useRef<MaskPoint[] | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setView({ width, height });
  }, []);

  const fit = useMemo(
    () => containFit(view, { width: image.width(), height: image.height() }),
    [view, image]
  );

  const toImage = useCallback(
    (x: number, y: number): MaskPoint => ({
      x: (x - fit.dx) / fit.scale,
      y: (y - fit.dy) / fit.scale,
    }),
    [fit]
  );
  const toView = useCallback(
    (p: MaskPoint): MaskPoint => ({ x: fit.dx + p.x * fit.scale, y: fit.dy + p.y * fit.scale }),
    [fit]
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .minDistance(0)
        .runOnJS(true)
        .onBegin((e) => {
          current.current = [toImage(e.x, e.y)];
          onStrokesChange([...strokes, { points: current.current, width: brushWidth }]);
        })
        .onUpdate((e) => {
          if (!current.current) return;
          current.current = [...current.current, toImage(e.x, e.y)];
          onStrokesChange([...strokes, { points: current.current, width: brushWidth }]);
        })
        .onFinalize(() => {
          current.current = null;
        }),
    [enabled, strokes, brushWidth, toImage, onStrokesChange]
  );

  const paths = useMemo(
    () =>
      view.width === 0
        ? []
        : strokes.map((stroke) => ({
            path: strokePath(stroke, toView),
            width: stroke.width * fit.scale,
          })),
    [strokes, toView, fit.scale, view.width]
  );

  return (
    <GestureDetector gesture={pan}>
      <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
        <Canvas style={StyleSheet.absoluteFill}>
          {paths.map(({ path, width }, index) => (
            <Path
              key={index}
              path={path}
              style="stroke"
              strokeWidth={width}
              strokeCap="round"
              strokeJoin="round"
              color={color}
            />
          ))}
        </Canvas>
      </View>
    </GestureDetector>
  );
}

/**
 * Renders brush strokes into an RGBA mask buffer at the image's resolution:
 * white where painted, black elsewhere, which is what `inpaint` reads as the
 * hole.
 * @param strokes - The strokes to render, in image pixels.
 * @param width - The image width in pixels.
 * @param height - The image height in pixels.
 * @returns The mask buffer, or `null` if Skia cannot allocate an offscreen surface.
 */
export function rasterizeMask(strokes: readonly MaskStroke[], width: number, height: number) {
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) return null;

  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('black'));

  const paint = Skia.Paint();
  paint.setColor(Skia.Color('white'));
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setStrokeJoin(StrokeJoin.Round);
  paint.setAntiAlias(false);

  for (const stroke of strokes) {
    paint.setStrokeWidth(stroke.width);
    canvas.drawPath(
      strokePath(stroke, (p) => p),
      paint
    );
  }

  surface.flush();
  return skImageToBuffer(surface.makeImageSnapshot());
}
