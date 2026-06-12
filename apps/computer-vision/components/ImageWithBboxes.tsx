import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Detection, Keypoint, PoseDetections } from 'react-native-executorch';
import Svg, {
  Circle,
  Line,
  Path,
  Polyline,
  Text as SvgText,
} from 'react-native-svg';
import BoundingBoxes from './BoundingBoxes';
import { COCO_SKELETON_CONNECTIONS } from './utils/cocoSkeleton';

export interface TrailPoint {
  x: number;
  y: number;
}

/** Joint-angle annotation: an arc at `vertex` between rays to `from`/`to`. */
export interface AngleMarker {
  vertex: TrailPoint;
  from: TrailPoint;
  to: TrailPoint;
  degrees: number;
}

const POSE_COLORS = ['lime', 'cyan', 'magenta', 'yellow', 'orange', 'pink'];

// Keypoints below the visibility threshold are emitted as (-1, -1).
const isVisibleKeypoint = (kp: Keypoint) => kp.x >= 0 && kp.y >= 0;

interface Props {
  imageUri: string;
  detections: Detection[];
  imageWidth: number;
  imageHeight: number;
  /** Polyline of points in image pixel space, e.g. an object's path over time. */
  trail?: TrailPoint[];
  /** Skeletons to draw, in image pixel space. */
  poses?: PoseDetections;
  /** Joint-angle arcs with degree labels, in image pixel space. */
  angleMarkers?: AngleMarker[];
  /** A dashed connector line (e.g. ball to striking foot), image px space. */
  linkLine?: { from: TrailPoint; to: TrailPoint } | null;
  /** 'contain' letterboxes the image, 'cover' fills the view and crops. */
  resizeMode?: 'contain' | 'cover';
  showLabels?: boolean;
}

export default function ImageWithBboxes({
  imageUri,
  detections,
  imageWidth,
  imageHeight,
  trail,
  poses,
  angleMarkers,
  linkLine,
  resizeMode = 'contain',
  showLabels = true,
}: Props) {
  const [layout, setLayout] = React.useState({ width: 0, height: 0 });

  const calculateAdjustedDimensions = () => {
    // Uniform scale: 'contain' fits the whole image inside the layout
    // (with bars), 'cover' fills the layout (cropped). Offsets center the
    // image either way and go negative for 'cover'.
    const fit = resizeMode === 'cover' ? Math.max : Math.min;
    const scale = fit(layout.width / imageWidth, layout.height / imageHeight);

    return {
      scaleX: scale,
      scaleY: scale,
      offsetX: (layout.width - imageWidth * scale) / 2,
      offsetY: (layout.height - imageHeight * scale) / 2,
    };
  };

  const { scaleX, scaleY, offsetX, offsetY } = calculateAdjustedDimensions();

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
        resizeMode={resizeMode}
        source={
          imageUri
            ? { uri: imageUri }
            : require('../assets/icons/executorch_logo.png')
        }
      />
      <BoundingBoxes
        detections={detections}
        scaleX={scaleX}
        scaleY={scaleY}
        offsetX={offsetX}
        offsetY={offsetY}
        containerWidth={layout.width}
        showLabels={showLabels}
      />
      {poses && poses.length > 0 && (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {poses.map((person, personIdx) => {
            const color = POSE_COLORS[personIdx % POSE_COLORS.length];
            return (
              <React.Fragment key={`pose-${personIdx}`}>
                {COCO_SKELETON_CONNECTIONS.map(([from, to], lineIdx) => {
                  const kp1 = person[from];
                  const kp2 = person[to];
                  if (!kp1 || !kp2) return null;
                  if (!isVisibleKeypoint(kp1) || !isVisibleKeypoint(kp2)) {
                    return null;
                  }
                  return (
                    <Line
                      key={`pose-${personIdx}-line-${lineIdx}`}
                      x1={kp1.x * scaleX + offsetX}
                      y1={kp1.y * scaleY + offsetY}
                      x2={kp2.x * scaleX + offsetX}
                      y2={kp2.y * scaleY + offsetY}
                      stroke={color}
                      strokeWidth={3}
                    />
                  );
                })}
                {Object.entries(person)
                  .filter(([, kp]) => isVisibleKeypoint(kp))
                  .map(([name, kp]) => (
                    <Circle
                      key={`pose-${personIdx}-kp-${name}`}
                      cx={kp.x * scaleX + offsetX}
                      cy={kp.y * scaleY + offsetY}
                      r={4}
                      fill={color}
                    />
                  ))}
              </React.Fragment>
            );
          })}
        </Svg>
      )}
      {trail && trail.length > 0 && (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {trail.length > 1 && (
            <Polyline
              points={trail
                .map(
                  (p) => `${p.x * scaleX + offsetX},${p.y * scaleY + offsetY}`
                )
                .join(' ')}
              fill="none"
              stroke="#FFD700"
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          <Circle
            cx={trail[trail.length - 1]!.x * scaleX + offsetX}
            cy={trail[trail.length - 1]!.y * scaleY + offsetY}
            r={6}
            fill="#FFD700"
            stroke="white"
            strokeWidth={1.5}
          />
        </Svg>
      )}
      {((angleMarkers && angleMarkers.length > 0) || linkLine) && (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {linkLine && (
            <Line
              x1={linkLine.from.x * scaleX + offsetX}
              y1={linkLine.from.y * scaleY + offsetY}
              x2={linkLine.to.x * scaleX + offsetX}
              y2={linkLine.to.y * scaleY + offsetY}
              stroke="#00E5FF"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
          )}
          {angleMarkers?.map((marker, idx) => {
            const vx = marker.vertex.x * scaleX + offsetX;
            const vy = marker.vertex.y * scaleY + offsetY;
            const a1 = Math.atan2(
              marker.from.y * scaleY + offsetY - vy,
              marker.from.x * scaleX + offsetX - vx
            );
            const a2 = Math.atan2(
              marker.to.y * scaleY + offsetY - vy,
              marker.to.x * scaleX + offsetX - vx
            );
            // Sweep through the interior (smaller) angle between the rays.
            let diff = a2 - a1;
            if (diff > Math.PI) diff -= 2 * Math.PI;
            if (diff <= -Math.PI) diff += 2 * Math.PI;
            const r = 14;
            const startX = vx + r * Math.cos(a1);
            const startY = vy + r * Math.sin(a1);
            const endX = vx + r * Math.cos(a2);
            const endY = vy + r * Math.sin(a2);
            const sweep = diff > 0 ? 1 : 0;
            const bisector = a1 + diff / 2;
            const labelX = vx + (r + 12) * Math.cos(bisector);
            const labelY = vy + (r + 12) * Math.sin(bisector);
            return (
              <React.Fragment key={`angle-${idx}`}>
                <Path
                  d={`M ${startX} ${startY} A ${r} ${r} 0 0 ${sweep} ${endX} ${endY}`}
                  stroke="#00E5FF"
                  strokeWidth={2}
                  fill="none"
                />
                <SvgText
                  x={labelX}
                  y={labelY + 4}
                  fill="white"
                  stroke="black"
                  strokeWidth={0.5}
                  fontSize={12}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {`${marker.degrees.toFixed(0)}°`}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    // Keep cropped image and overlays from painting outside in 'cover' mode.
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
