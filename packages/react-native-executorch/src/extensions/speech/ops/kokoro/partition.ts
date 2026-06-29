import { rnexecutorchJsi } from '../../../../native/bridge';

/**
 * A sub-range of a phoneme string identified by the partitioner.
 * @property offset - Start index of the segment in the original string.
 * @property length - Number of characters in the segment.
 */
export type Segment = {
  readonly offset: number;
  readonly length: number;
};

/**
 * Partitions a phoneme string into segments respecting the maximum token limit
 * per segment using the min-latency cost model.
 * @param text - The phoneme string to partition.
 * @param maxTokens - Maximum token capacity per segment.
 * @returns An array of segments with offset and length.
 */
export function partition(text: string, maxTokens: number): Segment[] {
  'worklet';
  return rnexecutorchJsi.speech.kokoro.partition(text, maxTokens) as Segment[];
}

/**
 * Lazily yields each substring described by the given segments.
 * @param text - The original string to slice from.
 * @param segments - Segments produced by {@link partition}.
 * @yields Substrings corresponding to each segment.
 */
export function* chunk(text: string, segments: Segment[]): Generator<string, void, void> {
  for (const seg of segments) {
    yield text.slice(seg.offset, seg.offset + seg.length);
  }
}
