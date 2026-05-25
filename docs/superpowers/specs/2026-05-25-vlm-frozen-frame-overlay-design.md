# VLM Camera — Frozen Frame + Streaming Response Overlay

**Date:** 2026-05-25
**File touched:** `apps/computer-vision/app/vlm_camera/index.tsx`

## Problem

On the VLM camera screen, when the user finishes speaking and the prompt goes to
the VLM, the captured frame is invisible — the live camera keeps running and the
VLM's response is only spoken (TTS), never shown as text. The user wants the
captured frame to freeze and lift over the camera, with the VLM's generated text
streaming in below it.

## Behavior

When the user stops recording and the prompt is sent to the VLM (state →
`thinking`):

1. The captured photo freezes and lifts into the upper area, elevated over a
   dimmed live camera.
2. The user's spoken transcript appears above the frame, framed as the question
   that was asked.
3. The VLM response streams token-by-token into a card just below the frame.
4. The frame, question, and response stay visible through `thinking` and
   `speaking`.
5. When TTS finishes (state → `idle`), the overlay auto-dismisses and the live
   camera shows through again.

## Layout (top → bottom)

Selected arrangement: **frame top, text card below** (dimmed live camera behind).

- User transcript (the question): small text, above the frame.
- Frozen frame: rounded card, elevated with shadow, ~62% width, centered in the
  upper area.
- Response card: dark translucent card below the frame, holds streaming
  `llm.response`.
- Mic/stop FAB: unchanged, stays at the bottom.
- Live camera: dimmed behind the entire overlay.

## State & Data

- **New state:** `frozenUri: string | null`.
  - Set to `dataUri` immediately after the photo is captured in `onMicPress`,
    before `setScreenState('thinking')`.
- **Render gate:** the frozen overlay renders when
  `frozenUri && (screenState === 'thinking' || screenState === 'speaking')`.
- **Frozen image source:** `<Image>` from `react-native` with
  `source={{ uri: frozenUri }}`.
- **Response text:** straight from existing `llm.response` (already streaming).
- **Question text:** from the existing `transcript` state.

## Temp-File Lifecycle

Currently `dataUri` (a `file://` path to a temp JPEG) is deleted in the
`.finally()` after `sendMessage` resolves. The `<Image>` now needs that file to
remain readable through the `speaking` state, so:

- **Remove** the `FileSystem.deleteAsync(dataUri, ...)` call from the
  `.finally()` on `sendMessage`.
- **Delete the previous frozen file** when a new recording starts
  (`startRecording`) and on component unmount, using a ref that holds the
  last frozen path.

This keeps exactly one temp JPEG alive at a time (the currently-displayed one),
cleaned up when the next prompt begins or the screen unmounts. It also avoids a
race where the image source is deleted while still being displayed.

## Dismissal

The existing `speaking → idle` drain effect already fires when TTS finishes.
Clearing the overlay is purely a render gate on `screenState`: when it returns to
`idle`, the overlay unmounts and the live camera shows through. `frozenUri` may
remain set (harmless); it is replaced and the old file cleaned on the next
prompt.

## Out of Scope / Non-Goals

- No animation spec beyond "lifts/elevated" (shadow + position); no requirement
  for a motion transition.
- No change to the recording, STT, VLM, or TTS pipelines.
- No new dependencies — `Image` is from `react-native`; all state and styles
  reuse existing patterns in the file.
