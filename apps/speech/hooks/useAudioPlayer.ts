import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioContext, type AudioBufferQueueSourceNode } from 'react-native-audio-api';

/**
 * An audio chunk yielded by a speech synthesis stream.
 */
export interface AudioChunk {
  /** Float32 PCM audio samples for this chunk, normalized in `[-1, 1]`. */
  readonly audio: Float32Array;
  /** Audio sampling rate in Hz. */
  readonly sampleRate: number;
}

/**
 * Controller methods and state for playing streaming TTS audio chunks.
 */
export interface AudioPlayerState {
  /** Whether audio is currently playing or enqueuing. */
  isPlaying: boolean;
  /**
   * Consumes an async generator of TTS chunks, enqueuing and playing them in real-time.
   * Resolves once all chunks have finished playing.
   * @param chunks Async iterable stream of audio chunks.
   * @param onChunk Optional callback invoked when each chunk is received.
   * @param onFirstAudio Optional callback invoked when the first audio buffer starts.
   */
  playStream: <T extends AudioChunk>(
    chunks: AsyncIterable<T>,
    onChunk?: (chunk: T) => void,
    onFirstAudio?: () => void
  ) => Promise<void>;
  /** Immediately stops audio playback, clears remaining buffers, and resets state. */
  stop: () => void;
}

/**
 * React hook managing streamed audio buffer queue playback via `react-native-audio-api`.
 *
 * Encapsulates the `AudioContext` and `AudioBufferQueueSourceNode` lifecycle,
 * streams incoming audio chunk buffers directly to native audio output, and
 * guarantees cleanup on unmount or cancellation.
 * @param sampleRate The target audio sampling rate in Hz (e.g. 44100 for Supertonic, 24000 for Kokoro).
 * @returns Audio playback state and controller methods.
 */
export function useAudioPlayer(sampleRate: number): AudioPlayerState {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const queueSourceRef = useRef<AudioBufferQueueSourceNode | null>(null);
  const completionResolverRef = useRef<(() => void) | null>(null);
  const lastEnqueuedBufferIdRef = useRef<string | null>(null);
  const streamDoneRef = useRef(false);

  const getAudioContext = useCallback(async () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext({ sampleRate });
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, [sampleRate]);

  const stop = useCallback(() => {
    if (queueSourceRef.current) {
      queueSourceRef.current.clearBuffers();
      queueSourceRef.current.stop();
      queueSourceRef.current = null;
    }
    setIsPlaying(false);
    lastEnqueuedBufferIdRef.current = null;
    streamDoneRef.current = false;
    if (completionResolverRef.current) {
      completionResolverRef.current();
      completionResolverRef.current = null;
    }
  }, []);

  const playStream = useCallback(
    async <T extends AudioChunk>(
      chunks: AsyncIterable<T>,
      onChunk?: (chunk: T) => void,
      onFirstAudio?: () => void
    ) => {
      stop();
      const ctx = await getAudioContext();
      const source = ctx.createBufferQueueSource();
      source.connect(ctx.destination);
      queueSourceRef.current = source;
      lastEnqueuedBufferIdRef.current = null;
      streamDoneRef.current = false;

      let started = false;

      const playbackFinished = new Promise<void>((resolve) => {
        completionResolverRef.current = resolve;
        source.onBufferEnded = (event) => {
          if (
            streamDoneRef.current &&
            event.bufferId != null &&
            event.bufferId === lastEnqueuedBufferIdRef.current
          ) {
            setIsPlaying(false);
            completionResolverRef.current = null;
            resolve();
          }
        };
      });

      try {
        for await (const chunk of chunks) {
          if (queueSourceRef.current !== source) break;
          const buffer = ctx.createBuffer(1, chunk.audio.length, chunk.sampleRate);
          buffer.copyToChannel(chunk.audio as Float32Array<ArrayBuffer>, 0);
          const bufferId = source.enqueueBuffer(buffer);
          lastEnqueuedBufferIdRef.current = bufferId;

          onChunk?.(chunk);

          if (!started) {
            started = true;
            setIsPlaying(true);
            source.start(0, 0);
            onFirstAudio?.();
          }
        }
        streamDoneRef.current = true;
      } catch (e) {
        stop();
        throw e;
      }

      await playbackFinished;
    },
    [getAudioContext, stop]
  );

  useEffect(() => {
    return () => {
      stop();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [stop]);

  return {
    isPlaying,
    playStream,
    stop,
  };
}
