# VLM Frozen-Frame + Streaming Response Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the VLM prompt is sent, freeze the captured frame and elevate it over a dimmed camera, with the user's transcript above it and the VLM's response streaming in a card below.

**Architecture:** Single-file UI change in `apps/computer-vision/app/vlm_camera/index.tsx`. Add a `frozenUri` state set at photo-capture time, render a conditional overlay gated on `screenState` (`thinking`/`speaking`), and adjust the temp-JPEG lifecycle so the displayed file survives until the next prompt.

**Tech Stack:** React Native (`Image`, `View`, `Text`, `StyleSheet`), Expo Router, react-native-executorch (`useLLM` streaming `llm.response`).

**Verification note:** This app has no RN component test harness (testing is manual via the iOS simulator per project conventions). Each task is verified by reading the diff and a final manual simulator run.

---

### Task 1: Add `Image` import and `frozenUri` state + cleanup ref

**Files:**
- Modify: `apps/computer-vision/app/vlm_camera/index.tsx:2-9` (import block)
- Modify: `apps/computer-vision/app/vlm_camera/index.tsx:58-61` (state block)

- [ ] **Step 1: Add `Image` to the react-native import**

Current import block (lines 2-9):

```tsx
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
```

Change to:

```tsx
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
```

- [ ] **Step 2: Add `frozenUri` state and a `frozenPathRef` for cleanup**

After the existing `const [transcript, setTranscript] = useState('');` (line 61), add:

```tsx
  const [frozenUri, setFrozenUri] = useState<string | null>(null);
  const frozenPathRef = useRef<string | null>(null);
```

- [ ] **Step 3: Verify it compiles (typecheck)**

Run: `npx tsc --noEmit -p apps/computer-vision/tsconfig.json`
Expected: no new errors referencing `vlm_camera/index.tsx`. (`Image` and the new state are referenced in later tasks; the unused-var lint may warn until Task 3 — that is expected and resolved by Task 3.)

- [ ] **Step 4: Commit**

```bash
git add apps/computer-vision/app/vlm_camera/index.tsx
git commit -m "feat(vlm_camera): add Image import and frozen-frame state"
```

---

### Task 2: Wire the temp-JPEG lifecycle to the frozen frame

**Files:**
- Modify: `apps/computer-vision/app/vlm_camera/index.tsx:263-265` (`startRecording` start — delete previous frozen file)
- Modify: `apps/computer-vision/app/vlm_camera/index.tsx:354-358` (set `frozenUri` at capture time)
- Modify: `apps/computer-vision/app/vlm_camera/index.tsx:376-381` (remove delete from `.finally`)
- Modify: `apps/computer-vision/app/vlm_camera/index.tsx:146-170` (unmount cleanup)

- [ ] **Step 1: Delete the previous frozen file when a new recording starts**

In `startRecording`, the body starts (line 263-265):

```tsx
  const startRecording = async () => {
    setError(null);
    setTranscript('');
```

Change to:

```tsx
  const startRecording = async () => {
    setError(null);
    setTranscript('');
    if (frozenPathRef.current) {
      FileSystem.deleteAsync(frozenPathRef.current, { idempotent: true }).catch(
        () => undefined
      );
      frozenPathRef.current = null;
    }
    setFrozenUri(null);
```

- [ ] **Step 2: Set `frozenUri` at capture time, before switching to `thinking`**

Current (lines 354-358):

```tsx
        const dataUri = tempPath.startsWith('file://')
          ? tempPath
          : `file://${tempPath}`;

        setScreenState('thinking');
```

Change to:

```tsx
        const dataUri = tempPath.startsWith('file://')
          ? tempPath
          : `file://${tempPath}`;

        frozenPathRef.current = dataUri;
        setFrozenUri(dataUri);
        setScreenState('thinking');
```

- [ ] **Step 3: Remove the temp-file delete from the `sendMessage` `.finally`**

Current (lines 376-381):

```tsx
          .finally(() => {
            // Best-effort cleanup of the temp JPEG.
            FileSystem.deleteAsync(dataUri, { idempotent: true }).catch(
              () => undefined
            );
          });
```

Remove the `.finally(...)` block entirely so the chain ends at `.catch(...)`:

```tsx
          });
```

(The preceding `.catch((e) => { ... })` already ends with `}`; ensure the statement is terminated with `;` after removing `.finally`. The temp JPEG is now cleaned up by `startRecording` on the next prompt and by the unmount effect below.)

- [ ] **Step 4: Delete the frozen file on unmount**

The unmount cleanup effect (lines 146-170) returns a teardown function. Add a frozen-file cleanup inside that returned function, after the existing `ttsStreamStopRef.current(true)` try/catch block and before the closing `};`:

```tsx
      if (frozenPathRef.current) {
        FileSystem.deleteAsync(frozenPathRef.current, {
          idempotent: true,
        }).catch(() => undefined);
      }
```

- [ ] **Step 5: Verify it compiles (typecheck)**

Run: `npx tsc --noEmit -p apps/computer-vision/tsconfig.json`
Expected: no new errors referencing `vlm_camera/index.tsx`. (`frozenUri` is still only assigned, not read, until Task 3 — an unused-var warning here is expected.)

- [ ] **Step 6: Commit**

```bash
git add apps/computer-vision/app/vlm_camera/index.tsx
git commit -m "feat(vlm_camera): keep captured JPEG alive for frozen frame display"
```

---

### Task 3: Render the frozen-frame overlay (frame + question + streaming response)

**Files:**
- Modify: `apps/computer-vision/app/vlm_camera/index.tsx:447-461` (insert overlay after the status container, replacing the standalone transcript overlay's role during freeze)
- Modify: `apps/computer-vision/app/vlm_camera/index.tsx:816-832` (add styles)

- [ ] **Step 1: Gate the existing transcript overlay so it only shows before freeze**

The existing transcript overlay (lines 454-461) currently shows whenever `transcript && screenState !== 'idle'`. During `thinking`/`speaking` the transcript will instead render inside the frozen overlay (as the question), so restrict the standalone overlay to the pre-freeze states.

Current:

```tsx
      {transcript && screenState !== 'idle' && (
        <View
          style={[styles.transcriptOverlay, { top: insets.top + 64 }]}
          pointerEvents="none"
        >
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      )}
```

Change the condition to only `recording`/`transcribing`:

```tsx
      {transcript &&
        (screenState === 'recording' || screenState === 'transcribing') && (
          <View
            style={[styles.transcriptOverlay, { top: insets.top + 64 }]}
            pointerEvents="none"
          >
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        )}
```

- [ ] **Step 2: Add the frozen-frame overlay**

Immediately after the block from Step 1 (and before the `bottomOverlay` `<View>` at line 463), insert:

```tsx
      {frozenUri &&
        (screenState === 'thinking' || screenState === 'speaking') && (
          <View
            style={[
              styles.frozenOverlay,
              { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 120 },
            ]}
            pointerEvents="none"
          >
            {transcript ? (
              <Text style={styles.frozenQuestion}>{transcript}</Text>
            ) : null}
            <Image
              source={{ uri: frozenUri }}
              style={styles.frozenImage}
              resizeMode="cover"
            />
            {llm.response ? (
              <View style={styles.frozenResponseCard}>
                <Text style={styles.frozenResponseText}>{llm.response}</Text>
              </View>
            ) : null}
          </View>
        )}
```

- [ ] **Step 3: Add the styles**

In the `StyleSheet.create({ ... })` block, after the `transcriptText` style (ends at line 831), add:

```tsx
  frozenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 7,
  },
  frozenQuestion: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  frozenImage: {
    width: '62%',
    aspectRatio: 3 / 4,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  frozenResponseCard: {
    marginTop: 16,
    width: '88%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 14,
  },
  frozenResponseText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
```

- [ ] **Step 4: Verify it compiles (typecheck)**

Run: `npx tsc --noEmit -p apps/computer-vision/tsconfig.json`
Expected: no errors referencing `vlm_camera/index.tsx`. The unused-var warnings from Tasks 1-2 are now resolved (`Image`, `frozenUri` are read here).

- [ ] **Step 5: Commit**

```bash
git add apps/computer-vision/app/vlm_camera/index.tsx
git commit -m "feat(vlm_camera): show frozen frame with streaming response overlay"
```

---

### Task 4: Manual verification in the simulator

**Files:** none (verification only)

- [ ] **Step 1: Run the app and exercise the flow**

Launch the computer-vision app on the iOS simulator, open the VLM camera screen,
wait for models to load, tap the mic, speak a question about what the camera
sees, then tap stop.

- [ ] **Step 2: Confirm each behavior**

Verify:
- On stop → `thinking`: the live camera dims and the captured frame appears,
  elevated, in the upper area.
- The spoken transcript shows above the frame as the question.
- The VLM response streams token-by-token into the card below the frame.
- The frame + response remain through `speaking`.
- When speech finishes (→ `idle`): the overlay disappears and the live camera
  returns.
- Starting a new prompt replaces the frozen frame; no stale image flashes.

- [ ] **Step 3: Confirm no leaked temp files / errors**

Check the Metro logs for `sendMessage error`, image-load errors, or
`deleteAsync` rejections. None expected.
