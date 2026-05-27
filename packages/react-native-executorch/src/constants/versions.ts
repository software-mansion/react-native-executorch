const PREVIOUS_LIB_VERSION = '0.9.0';
export const LIB_VERSION = '0.10.0';

export const URL_PREFIX =
  'https://huggingface.co/software-mansion/react-native-executorch';
// Latest stable release. Use for back-compat references that should follow
// the last published version rather than the in-development VERSION_TAG.
export const PREVIOUS_VERSION_TAG = `resolve/v${PREVIOUS_LIB_VERSION}`;
// In-development version; resolves to whatever LIB_VERSION on main currently
// targets. Models served under this tag may not be published yet.
export const VERSION_TAG = `resolve/v${LIB_VERSION}`;
