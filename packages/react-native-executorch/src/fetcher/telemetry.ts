import { Platform } from 'react-native';
import { rnexecutorchJsi } from '../native/bridge';

// Anonymous download analytics endpoint.
const DOWNLOAD_EVENT_ENDPOINT = 'https://ai.swmansion.com/telemetry/downloads/api/downloads';

// Informational only.
// TODO: source this from the package version once version handling lands.
// See https://github.com/software-mansion/react-native-executorch/issues/1291
const LIB_VERSION = '0.0.0';

// Anonymous analytics are on by default; apps opt out via setTelemetryEnabled.
let telemetryEnabled = true;

// Telemetry must never break a download, so every failure is swallowed. Surface
// it in development so a genuinely broken payload doesn't go unnoticed.
function warn(message: string, error: unknown): void {
  // eslint-disable-next-line no-console
  if (__DEV__) console.warn(`[RNE Telemetry] ${message}:`, error);
}

/**
 * Enables or disables the anonymous download analytics sent to Software Mansion.
 * Analytics are enabled by default; call `setTelemetryEnabled(false)` (e.g. once
 * at app startup) to opt out. This does not affect the Hugging Face download
 * counter, a standard model-download stat that always fires.
 * @category Utils
 * @param enabled Whether to send anonymous download analytics.
 */
export function setTelemetryEnabled(enabled: boolean): void {
  telemetryEnabled = enabled;
}

// Whether the given URL points to a Software Mansion Hugging Face repo.
function isSwmHuggingFaceRepo(url: URL): boolean {
  return url.host === 'huggingface.co' && url.pathname.startsWith('/software-mansion');
}

/**
 * Increments the Hugging Face download counter for Software Mansion repos by
 * issuing a HEAD request to the repo's `config.json`, following HF's
 * download-stats convention. No-op for any other host.
 *
 * See https://huggingface.co/docs/hub/models-download-stats
 * @param uri The URI of the file being downloaded.
 */
export function triggerHuggingFaceDownloadCounter(uri: string): void {
  try {
    const url = new URL(uri);
    if (!isSwmHuggingFaceRepo(url)) return;
    const base = `${url.protocol}//${url.host}${url.pathname.split('resolve')[0]}`;
    // Fire-and-forget; its success is irrelevant to the download itself.
    fetch(`${base}resolve/main/config.json`, { method: 'HEAD' }).catch((e) => {
      warn('Hugging Face download counter request failed', e);
    });
  } catch (e) {
    warn('Failed to trigger the Hugging Face download counter', e);
  }
}

function getCountryCode(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale.split('-').pop();
    if (region && region.length === 2) return region.toUpperCase();
  } catch (e) {
    warn('Failed to resolve the country code', e);
  }
  return 'UNKNOWN';
}

function getModelNameFromUri(uri: string): string {
  try {
    const filename = new URL(uri).pathname.split('/').pop() ?? uri;
    return filename.replace(/\.[^.]+$/, '');
  } catch (e) {
    warn('Failed to derive the model name from the URI', e);
    return uri;
  }
}

/**
 * Sends an anonymous download event to the Software Mansion analytics endpoint,
 * unless the app has opted out via {@link setTelemetryEnabled}. Fire-and-forget;
 * never throws and never blocks the download.
 * @param uri The URI of the downloaded resource.
 */
export function triggerDownloadEvent(uri: string): void {
  if (!telemetryEnabled) return;
  try {
    fetch(DOWNLOAD_EVENT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelName: getModelNameFromUri(uri),
        countryCode: getCountryCode(),
        // Set by the native installer (Android build props / TARGET_OS_SIMULATOR)
        // so development traffic can be filtered out server-side.
        isEmulator: rnexecutorchJsi.isEmulator,
        platform: Platform.OS,
        libVersion: LIB_VERSION,
      }),
    }).catch((e) => {
      warn('Download event request failed', e);
    });
  } catch (e) {
    warn('Failed to send the download event', e);
  }
}
