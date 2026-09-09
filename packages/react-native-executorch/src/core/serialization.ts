/**
 * Making values safe to send across a worklet runtime boundary.
 *
 * `react-native-worklets` only learned to serialize an `ArrayBufferView`
 * natively in 0.10.0 ([reanimated
 * #9475](https://github.com/software-mansion/react-native-reanimated/pull/9475)).
 * Before that a view was serialized as an initializer that rebuilt it on the
 * target runtime with `new Ctor(buffer)` — over the *whole* backing buffer,
 * dropping `byteOffset` and `length`. A caller that hands a pipeline a rolling
 * window into a larger buffer, which is the normal shape of streaming audio and
 * of pooled camera frames, silently gets the entire buffer instead: no error,
 * just the wrong samples or the wrong pixels.
 *
 * ```ts
 * const window = recording.subarray(cursor, cursor + 16_000);
 * await detectVoice(window); //  worklets <= 0.9 sees all of `recording`
 * ```
 *
 * So every value that crosses the boundary — the arguments going in, the result
 * coming back — is walked first, and any view that is not already tight is
 * copied into one that is. A tight view is returned untouched, which is the
 * overwhelmingly common case, so the walk normally allocates nothing.
 *
 * This runs on both sides of the hop, so it carries the `'worklet'` directive.
 */

/**
 * How deep the walk goes before giving up.
 *
 * Arguments and results are shallow — an `ImageBuffer` and an options object,
 * a list of detections — so this is only a backstop against a cyclic or
 * pathologically nested value, which would otherwise recurse forever.
 */
const MAX_DEPTH = 8;

/**
 * Whether a view already spans its entire backing buffer.
 *
 * Only these survive the pre-0.10 serializer unchanged: rebuilding one with
 * `new Ctor(buffer)` reproduces it exactly.
 * @param view The view to test.
 * @returns `true` when the view covers the whole buffer from offset zero.
 */
function isTight(view: ArrayBufferView): boolean {
  'worklet';
  return view.byteOffset === 0 && view.byteLength === view.buffer.byteLength;
}

/**
 * Copies a view into a fresh buffer that it exactly fills.
 * @param view The view to copy.
 * @returns A view of the same type over its own tightly sized buffer.
 */
function tighten(view: ArrayBufferView): ArrayBufferView {
  'worklet';
  const buffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
  if (view instanceof DataView) {
    return new DataView(buffer);
  }
  // Every TypedArray constructor accepts a buffer, and the view's own
  // constructor is the only thing that knows which one it is.
  const constructor = (view as { constructor: unknown }).constructor as new (
    tightBuffer: ArrayBufferLike
  ) => ArrayBufferView;
  return new constructor(buffer);
}

/**
 * Replaces every offset or partial `ArrayBufferView` in `value` with a tight
 * copy, leaving everything else — and every already-tight view — as it is.
 *
 * Arrays and plain objects are walked; anything with a prototype of its own
 * (a native handle, a `Synchronizable`, a class instance) is passed through
 * untouched, because copying it would break identity that the other side
 * depends on.
 * @typeParam T The type of the value being sent.
 * @param value The value about to cross a worklet runtime boundary.
 * @param depth Current recursion depth. Internal.
 * @returns `value` itself when nothing needed tightening, otherwise a copy with
 * the offending views replaced.
 */
export function tightenArrayBufferViews<T>(value: T, depth: number = 0): T {
  'worklet';
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (ArrayBuffer.isView(value)) {
    return (isTight(value) ? value : tighten(value)) as T;
  }

  if (depth >= MAX_DEPTH) {
    return value;
  }

  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((entry) => {
      const tightened = tightenArrayBufferViews(entry, depth + 1);
      changed ||= tightened !== entry;
      return tightened;
    });
    return (changed ? next : value) as T;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return value;
  }

  let changed = false;
  const next: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    const entry = (value as Record<string, unknown>)[key];
    const tightened = tightenArrayBufferViews(entry, depth + 1);
    changed ||= tightened !== entry;
    next[key] = tightened;
  }
  return (changed ? next : value) as T;
}
