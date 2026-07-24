import { Platform } from 'react-native';

// Anonymous download analytics endpoint.
const DOWNLOAD_EVENT_ENDPOINT = 'https://ai.swmansion.com/telemetry/downloads/api/downloads';

// Informational only.
// TODO: source this from the package version once version handling lands.
// See https://github.com/software-mansion/react-native-executorch/issues/1291
const LIB_VERSION = '0.0.0';

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
    fetch(`${base}resolve/main/config.json`, { method: 'HEAD' }).catch(() => {});
  } catch {}
}

function getCountryCode(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale.split('-').pop();
    if (region && region.length === 2) return region.toUpperCase();
  } catch {}
  return 'UNKNOWN';
}

// Set by the native layer when running on a simulator/emulator, so dev traffic
// can be filtered out server-side. Absent (⇒ false) until then.
function isEmulator(): boolean {
  return (globalThis as { __rne_isEmulator?: boolean }).__rne_isEmulator === true;
}

function getModelNameFromUri(uri: string): string {
  try {
    const filename = new URL(uri).pathname.split('/').pop() ?? uri;
    return filename.replace(/\.[^.]+$/, '');
  } catch {
    return uri;
  }
}

/**
 * Sends an anonymous download event to the Software Mansion analytics endpoint.
 * Fire-and-forget; never throws and never blocks the download.
 * @param uri The URI of the downloaded resource.
 */
export function triggerDownloadEvent(uri: string): void {
  try {
    fetch(DOWNLOAD_EVENT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelName: getModelNameFromUri(uri),
        countryCode: getCountryCode(),
        isEmulator: isEmulator(),
        platform: Platform.OS,
        libVersion: LIB_VERSION,
      }),
    }).catch(() => {});
  } catch {}
}
