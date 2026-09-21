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
   * Resolves once the final enqueued buffer has finished playing.
   * @param chunks Async iterable stream of audio chunks.
   * @param onChunk Optional callback invoked for every chunk as it is enqueued.
   * @param onFirstAudio Optional callback invoked when the first buffer starts playing.
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
 *
 * Playback completion is detected by correlating the `bufferId` of the last
 * enqueued buffer with the `onBufferEnded` event. The stream is only considered
 * finished once both the async generator has been fully consumed and that final
 * buffer has finished playing, in whichever order those happen. This avoids the
 * queue underrun races that occur when relying on `isLastBufferInQueue`.
 * @param sampleRate The target audio sampling rate in Hz (e.g. 44100 for Supertonic, 24000 for Kokoro).
 * @returns Audio playback state and controller methods.
 */
export function useAudioPlayer(sampleRate: number): AudioPlayerState {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const queueSourceRef = useRef<AudioBufferQueueSourceNode | null>(null);
  const resolveCompletionRef = useRef<(() => void) | null>(null);
  const lastEnqueuedBufferIdRef = useRef<string | null>(null);
  const lastBufferEndedRef = useRef(false);
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
    lastBufferEndedRef.current = false;
    streamDoneRef.current = false;
    const resolve = resolveCompletionRef.current;
    resolveCompletionRef.current = null;
    resolve?.();
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
      lastBufferEndedRef.current = false;
      streamDoneRef.current = false;

      let started = false;

      const finishIfDone = () => {
        if (!streamDoneRef.current || !lastBufferEndedRef.current) return;
        const resolve = resolveCompletionRef.current;
        resolveCompletionRef.current = null;
        setIsPlaying(false);
        resolve?.();
      };

      const playbackFinished = new Promise<void>((resolve) => {
        resolveCompletionRef.current = resolve;
      });

      source.onBufferEnded = (event) => {
        if (event.bufferId != null && event.bufferId === lastEnqueuedBufferIdRef.current) {
          lastBufferEndedRef.current = true;
          finishIfDone();
        }
      };

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
        if (!started) {
          lastBufferEndedRef.current = true;
        }
        finishIfDone();
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
