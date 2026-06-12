import Spinner from '../../components/Spinner';
import {
  models,
  Detection,
  Keypoint,
  PersonKeypoints,
  PoseDetections,
  useObjectDetection,
} from 'react-native-executorch';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ImageWithBboxes, {
  AngleMarker,
  TrailPoint,
} from '../../components/ImageWithBboxes';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Asset } from 'expo-asset';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';
import ErrorBanner from '../../components/ErrorBanner';
import ColorPalette from '../../colors';
import { fps as sourceFps, frames } from '../../assets/video_frames';
import { useRfDetrPose } from '../../useRfDetrPose';
import {
  BallSample,
  DISPLAY_SCORE_THRESHOLD,
  LOW_DETECTION_THRESHOLD,
  trackedBall,
} from '../../ballTracking';

const objectDetection = models.object_detection;

interface LoadedFrame {
  uri: string;
  width: number;
  height: number;
}

interface CachedResult {
  detections: Detection[];
  poses: PoseDetections;
  inferenceTime: number;
}

// Per-frame kick stats. Angles are 2D projections — a joint bent toward the
// camera reads shallower than it really is. Speed is scaled from pixels to
// meters via the ball's known diameter, so it shares the same caveat.
interface PoseStats {
  kneeLeftDeg: number | null;
  kneeRightDeg: number | null;
  torsoLeanDeg: number | null;
  ballSpeedKmh: number | null;
}

// Frozen biomechanics at the moment the kick was detected.
interface ImpactSnapshot {
  foot: 'LEFT' | 'RIGHT';
  kneeDeg: number | null;
  torsoLeanDeg: number | null;
}

// Fallback playback pacing when the bundled frames carry no fps.
const PLAYBACK_FPS = 30;

// Logs the per-frame ball-tracking decision chain (kick detection) to the
// console.
const DEBUG_BALL_TRACKING = true;

// The ball counts as kicked once it moves this many of its own diameters
// away from where it was first seen (the penalty spot).
const KICK_DISPLACEMENT_DIAMETERS = 1;

// A regulation football is ~22 cm across; with the apparent ball diameter in
// pixels this converts image-space displacement into real-world speed.
const BALL_DIAMETER_M = 0.22;

const fmtDeg = (value: number | null) =>
  value === null ? '—' : `${value.toFixed(0)}°`;

// Keypoints below the visibility threshold are emitted as (-1, -1).
const isVisibleKp = (kp: Keypoint) => kp.x >= 0 && kp.y >= 0;

// Angle at vertex `b` between the rays b->a and b->c, in degrees.
function angleAtDeg(a: Keypoint, b: Keypoint, c: Keypoint): number | null {
  if (!isVisibleKp(a) || !isVisibleKp(b) || !isVisibleKp(c)) return null;
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const n1 = Math.hypot(v1x, v1y);
  const n2 = Math.hypot(v2x, v2y);
  if (n1 < 1 || n2 < 1) return null;
  const cos = Math.min(Math.max((v1x * v2x + v1y * v2y) / (n1 * n2), -1), 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

// Tilt of the shoulder-mid -> hip-mid axis away from vertical, in degrees.
function torsoLeanDeg(person: PersonKeypoints): number | null {
  const { LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP } = person;
  if (
    ![LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP].every(isVisibleKp)
  ) {
    return null;
  }
  const vx =
    (LEFT_SHOULDER.x + RIGHT_SHOULDER.x) / 2 - (LEFT_HIP.x + RIGHT_HIP.x) / 2;
  const vy =
    (LEFT_SHOULDER.y + RIGHT_SHOULDER.y) / 2 - (LEFT_HIP.y + RIGHT_HIP.y) / 2;
  const n = Math.hypot(vx, vy);
  if (n < 1) return null;
  const cos = Math.min(Math.max(-vy / n, -1), 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

// The kicker is whoever's foot is closest to the ball (the keeper is in the
// pose output too).
function kickerPose(
  poses: PoseDetections,
  ball: TrailPoint | null
): PersonKeypoints | null {
  if (poses.length === 0) return null;
  if (!ball || poses.length === 1) return poses[0]!;
  let best = poses[0]!;
  let bestDistance = Infinity;
  for (const person of poses) {
    for (const ankle of [person.LEFT_ANKLE, person.RIGHT_ANKLE]) {
      if (!isVisibleKp(ankle)) continue;
      const d = Math.hypot(ankle.x - ball.x, ankle.y - ball.y);
      if (d < bestDistance) {
        bestDistance = d;
        best = person;
      }
    }
  }
  return best;
}

export default function VideoReplayScreen() {
  const [loadedFrames, setLoadedFrames] = useState<LoadedFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<LoadedFrame | null>(null);
  const [results, setResults] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);
  const [effectiveFps, setEffectiveFps] = useState(0);
  const [isCachedPlayback, setIsCachedPlayback] = useState(false);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [poses, setPoses] = useState<PoseDetections>([]);
  const [poseStats, setPoseStats] = useState<PoseStats>({
    kneeLeftDeg: null,
    kneeRightDeg: null,
    torsoLeanDeg: null,
    ballSpeedKmh: null,
  });
  const [impact, setImpact] = useState<ImpactSnapshot | null>(null);
  const [angleMarkers, setAngleMarkers] = useState<AngleMarker[]>([]);
  const [ballFootLine, setBallFootLine] = useState<{
    from: TrailPoint;
    to: TrailPoint;
  } | null>(null);

  const router = useRouter();
  const model = useObjectDetection({ model: objectDetection.rf_detr_nano() });
  const poseModel = useRfDetrPose();
  const { setGlobalGenerating } = useContext(GeneratingContext);

  // The playback loop is a long-lived async function; the ref lets it react
  // to pause/unmount between awaits.
  const playingRef = useRef(false);
  const frameIndexRef = useRef(0);
  // Per-frame predictions from the first pass; later passes replay from here
  // instead of re-running inference. Keyed by frame index, cleared on model
  // switch.
  const resultsCacheRef = useRef<Map<number, CachedResult>>(new Map());
  // Ball positions observed in the current pass; cleared when the video wraps.
  const ballTrackRef = useRef<BallSample[]>([]);
  // Frame where the ball left the penalty spot.
  const kickFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setGlobalGenerating(model.isGenerating || poseModel.isGenerating);
  }, [model.isGenerating, poseModel.isGenerating, setGlobalGenerating]);

  useEffect(() => {
    if (model.error) setError(String(model.error));
  }, [model.error]);

  useEffect(() => {
    if (poseModel.error) setError(String(poseModel.error));
  }, [poseModel.error]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (frames.length === 0) return;
      try {
        const assets = await Asset.loadAsync(frames);
        if (cancelled) return;
        const loaded = assets.map((a) => ({
          uri: a.localUri ?? a.uri,
          width: a.width ?? 0,
          height: a.height ?? 0,
        }));
        setLoadedFrames(loaded);
        setCurrentFrame(loaded[0] ?? null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      playingRef.current = false;
    };
  }, []);

  // The rest of the app is portrait-locked; go landscape only while this
  // screen is focused since the test video is horizontal.
  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      ).catch(() => {});
      return () => {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        ).catch(() => {});
      };
    }, [])
  );

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    setIsPlaying(false);
  }, []);

  // `forward` must be captured once when playback starts: the hook recreates
  // it on every render with the current `isGenerating` baked into its guard,
  // so reading the latest one right after an await would see the stale `true`
  // and throw ModelGenerating. The loop awaits each call, so inference never
  // actually overlaps.
  const playLoop = useCallback(
    async (
      framesToPlay: LoadedFrame[],
      detect: (
        uri: string,
        options?: { detectionThreshold?: number }
      ) => Promise<Detection[]>,
      estimatePose: (uri: string) => Promise<PoseDetections>
    ) => {
      const fps = sourceFps > 0 ? sourceFps : PLAYBACK_FPS;
      const targetFrameMs = 1000 / fps;
      while (playingRef.current) {
        const frameIndex = frameIndexRef.current;
        const frame = framesToPlay[frameIndex]!;
        const start = Date.now();
        try {
          let cached = resultsCacheRef.current.get(frameIndex);
          if (!cached) {
            const detections = await detect(frame.uri, {
              detectionThreshold: LOW_DETECTION_THRESHOLD,
            });
            if (!playingRef.current) break;
            const framePoses = await estimatePose(frame.uri);
            if (!playingRef.current) break;
            cached = {
              detections,
              poses: framePoses,
              inferenceTime: Date.now() - start,
            };
            resultsCacheRef.current.set(frameIndex, cached);
            setIsCachedPlayback(false);
          } else {
            setIsCachedPlayback(true);
          }

          // Restart the per-pass analysis on every wrap so the trace doesn't
          // connect the last frame back to the first.
          if (frameIndex === 0) {
            ballTrackRef.current = [];
            kickFrameRef.current = null;
            setImpact(null);
          }
          const kickAlreadyKnown = kickFrameRef.current !== null;
          const prevSample =
            ballTrackRef.current[ballTrackRef.current.length - 1] ?? null;
          const center = trackedBall(cached.detections, prevSample);
          if (center) {
            ballTrackRef.current.push({ ...center, frameIndex });
          }
          const track = ballTrackRef.current;
          // The kick happened once the ball moved a full diameter off the
          // spot; the previous sighting is when it was last still there.
          if (kickFrameRef.current === null && track.length > 1) {
            const spot = track[0]!;
            const latest = track[track.length - 1]!;
            const displacement = Math.hypot(
              latest.x - spot.x,
              latest.y - spot.y
            );
            const kickThreshold = spot.size * KICK_DISPLACEMENT_DIAMETERS;
            if (DEBUG_BALL_TRACKING) {
              console.log(
                `[ball] f=${frameIndex} kick check: moved=${displacement.toFixed(1)}px threshold=${kickThreshold.toFixed(1)}px (spot size=${spot.size.toFixed(1)})`
              );
            }
            if (displacement > kickThreshold) {
              kickFrameRef.current = track[track.length - 2]!.frameIndex;
              if (DEBUG_BALL_TRACKING) {
                console.log(`[ball] KICK at frame ${kickFrameRef.current}`);
              }
            }
          }
          // Apparent ball speed over the last few sightings, scaled to
          // real-world units via the ball's known diameter. Only meaningful
          // when the ball was seen this frame — stale samples would report
          // the speed of an old segment.
          let ballSpeedKmh: number | null = null;
          if (center && track.length > 1) {
            const recent = track.slice(-4);
            const first = recent[0]!;
            const last = recent[recent.length - 1]!;
            const frameGap = last.frameIndex - first.frameIndex;
            if (frameGap > 0) {
              const metersPerPx =
                BALL_DIAMETER_M / ((first.size + last.size) / 2);
              const metersPerSecond =
                (Math.hypot(last.x - first.x, last.y - first.y) *
                  metersPerPx *
                  fps) /
                frameGap;
              ballSpeedKmh = metersPerSecond * 3.6;
            }
          }
          if (DEBUG_BALL_TRACKING) {
            console.log(
              `[ball] f=${frameIndex}` +
                ` ball=${center ? `${center.x.toFixed(0)},${center.y.toFixed(0)}(sz ${center.size.toFixed(1)} sc ${center.score.toFixed(2)})` : 'MISS'}` +
                ` track=${track.length}` +
                ` speed=${ballSpeedKmh !== null ? ballSpeedKmh.toFixed(1) : '-'}` +
                ` kickF=${kickFrameRef.current ?? '-'}`
            );
          }
          // Kick biomechanics from the pose stream: plain 2D angle math on
          // keypoints already computed for the skeleton overlay.
          const person = kickerPose(cached.poses, center);
          let kneeLeftDeg: number | null = null;
          let kneeRightDeg: number | null = null;
          let leanDeg: number | null = null;
          let ballToFootPx: number | null = null;
          let strikingFoot: 'LEFT' | 'RIGHT' | null = null;
          const markers: AngleMarker[] = [];
          let footLink: { from: TrailPoint; to: TrailPoint } | null = null;
          if (person) {
            kneeLeftDeg = angleAtDeg(
              person.LEFT_HIP,
              person.LEFT_KNEE,
              person.LEFT_ANKLE
            );
            kneeRightDeg = angleAtDeg(
              person.RIGHT_HIP,
              person.RIGHT_KNEE,
              person.RIGHT_ANKLE
            );
            leanDeg = torsoLeanDeg(person);
            if (kneeLeftDeg !== null) {
              markers.push({
                vertex: person.LEFT_KNEE,
                from: person.LEFT_HIP,
                to: person.LEFT_ANKLE,
                degrees: kneeLeftDeg,
              });
            }
            if (kneeRightDeg !== null) {
              markers.push({
                vertex: person.RIGHT_KNEE,
                from: person.RIGHT_HIP,
                to: person.RIGHT_ANKLE,
                degrees: kneeRightDeg,
              });
            }
            if (center) {
              for (const side of ['LEFT', 'RIGHT'] as const) {
                const ankle =
                  side === 'LEFT' ? person.LEFT_ANKLE : person.RIGHT_ANKLE;
                if (!isVisibleKp(ankle)) continue;
                const d = Math.hypot(ankle.x - center.x, ankle.y - center.y);
                if (ballToFootPx === null || d < ballToFootPx) {
                  ballToFootPx = d;
                  strikingFoot = side;
                  footLink = {
                    from: { x: ankle.x, y: ankle.y },
                    to: { x: center.x, y: center.y },
                  };
                }
              }
              // Only draw the connector while the foot is near the ball.
              if (ballToFootPx !== null && ballToFootPx > center.size * 6) {
                footLink = null;
              }
            }
          }
          // Freeze the biomechanics at the frame the kick was detected on.
          if (!kickAlreadyKnown && kickFrameRef.current !== null) {
            setImpact({
              foot: strikingFoot ?? 'RIGHT',
              kneeDeg: strikingFoot === 'LEFT' ? kneeLeftDeg : kneeRightDeg,
              torsoLeanDeg: leanDeg,
            });
          }

          setCurrentFrame(frame);
          // The person is rendered as a skeleton instead of a detection box;
          // boxes keep the usual confidence bar despite the low-threshold run.
          setResults(
            cached.detections.filter(
              (d) =>
                String(d.label) !== 'PERSON' &&
                d.score >= DISPLAY_SCORE_THRESHOLD
            )
          );
          setPoses(cached.poses);
          setInferenceTime(cached.inferenceTime);
          setTrail(track.map(({ x, y }) => ({ x, y })));
          setPoseStats({
            kneeLeftDeg,
            kneeRightDeg,
            torsoLeanDeg: leanDeg,
            ballSpeedKmh,
          });
          setAngleMarkers(markers);
          setBallFootLine(footLink);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
          playingRef.current = false;
          setIsPlaying(false);
          break;
        }
        const elapsed = Date.now() - start;
        if (elapsed < targetFrameMs) {
          await new Promise((resolve) =>
            setTimeout(resolve, targetFrameMs - elapsed)
          );
        }
        setEffectiveFps(1000 / Math.max(Date.now() - start, 1));
        frameIndexRef.current =
          (frameIndexRef.current + 1) % framesToPlay.length;
      }
    },
    []
  );

  const startPlayback = useCallback(() => {
    if (playingRef.current) return;
    playingRef.current = true;
    setIsPlaying(true);
    playLoop(loadedFrames, model.forward, poseModel.forward);
    // The forwards are recreated every render; capturing them here on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedFrames, playLoop, model.isReady, poseModel.isReady]);

  if (!model.isReady || !poseModel.isReady) {
    const progress = Math.min(
      model.downloadProgress,
      poseModel.downloadProgress
    );
    return (
      <Spinner
        visible
        textContent={`Loading the models ${(progress * 100).toFixed(0)} %`}
      />
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.root}>
        <View style={styles.videoArea}>
          {currentFrame && (
            <ImageWithBboxes
              imageUri={currentFrame.uri}
              imageWidth={currentFrame.width}
              imageHeight={currentFrame.height}
              detections={results}
              trail={trail}
              poses={poses}
              angleMarkers={angleMarkers}
              linkLine={ballFootLine}
              resizeMode="cover"
              showLabels={false}
            />
          )}
          {loadedFrames.length === 0 && (
            <View style={styles.infoOverlay} pointerEvents="none">
              <Text style={styles.infoTitle}>Video Replay</Text>
              <Text style={styles.infoText}>
                No test video frames bundled. Extract frames from an mp4, then
                rebuild the app:
              </Text>
              <Text style={styles.codeText}>
                node scripts/extract-video-frames.mjs ~/video.mp4 --fps 30
              </Text>
            </View>
          )}
          {loadedFrames.length > 0 && (
            <View style={styles.topOverlay} pointerEvents="none">
              <Text style={styles.hudText}>
                Frame {frameIndexRef.current + 1}/{loadedFrames.length} ·{' '}
                {effectiveFps.toFixed(1)} FPS (source {sourceFps} FPS)
                {inferenceTime !== null ? ` · ${inferenceTime} ms` : ''}
                {isCachedPlayback ? ' · cached replay' : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sidePanel}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>KNEE FLEXION</Text>
            <View style={styles.kneeRow}>
              <View style={styles.kneeCol}>
                <Text style={styles.kneeSide}>L</Text>
                <Text style={styles.statValueSmall}>
                  {fmtDeg(poseStats.kneeLeftDeg)}
                </Text>
              </View>
              <View style={styles.kneeDivider} />
              <View style={styles.kneeCol}>
                <Text style={styles.kneeSide}>R</Text>
                <Text style={styles.statValueSmall}>
                  {fmtDeg(poseStats.kneeRightDeg)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TORSO LEAN</Text>
            <Text style={styles.statValue}>
              {fmtDeg(poseStats.torsoLeanDeg)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>BALL SPEED</Text>
            <Text style={styles.statValue}>
              {poseStats.ballSpeedKmh !== null ? (
                <>
                  {poseStats.ballSpeedKmh.toFixed(0)}
                  <Text style={styles.statUnit}> km/h</Text>
                </>
              ) : (
                '—'
              )}
            </Text>
          </View>

          {/* Always rendered so the panel layout doesn't shift when the
              impact stats arrive mid-playback. */}
          <View style={[styles.statCard, styles.impactCard]}>
            <Text style={[styles.statLabel, styles.impactLabel]}>IMPACT</Text>
            <Text style={styles.statValueSmall}>
              {impact ? `${impact.foot} FOOT` : '—'}
            </Text>
            <Text style={styles.statSub}>
              knee {fmtDeg(impact?.kneeDeg ?? null)} · lean{' '}
              {fmtDeg(impact?.torsoLeanDeg ?? null)}
            </Text>
          </View>

          <View style={styles.panelSpacer} />

          {!isPlaying && (
            <TouchableOpacity
              style={styles.playButton}
              // A model can still be draining an inference left in flight by
              // an error stop; starting a new loop would overlap with it.
              disabled={
                loadedFrames.length === 0 ||
                model.isGenerating ||
                poseModel.isGenerating
              }
              onPress={startPlayback}
            >
              <Text style={styles.playButtonText}>Play</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.errorOverlay}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            stopPlayback();
            router.navigate('/');
          }}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'black',
  },
  videoArea: {
    flex: 1,
  },
  sidePanel: {
    width: 240,
    backgroundColor: '#0B0D12',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.12)',
    padding: 12,
    gap: 10,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.45)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0,
  },
  statValueSmall: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    fontVariant: ['tabular-nums'],
  },
  statSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  kneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kneeCol: {
    flex: 1,
  },
  kneeSide: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
  },
  kneeDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 12,
  },
  impactCard: {
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderColor: 'rgba(0,229,255,0.35)',
  },
  impactLabel: {
    color: '#00E5FF',
  },
  panelSpacer: {
    flex: 1,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  topOverlay: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hudText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  infoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  codeText: {
    fontSize: 12,
    color: '#ddd',
    fontFamily: 'Courier',
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 8,
    borderRadius: 4,
  },
  playButton: {
    backgroundColor: ColorPalette.strongPrimary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
