# Variable: VALID_ERROR_CODES

> `const` **VALID_ERROR_CODES**: readonly \[`"LOAD_FAILED"`, `"EXECUTION_FAILED"`, `"SCHEMA_MISMATCH"`, `"INVALID_ARGUMENT"`, `"INVALID_STATE"`, `"RESOURCE_DISPOSED"`, `"RESOURCE_BUSY"`, `"DOWNLOAD_FAILED"`, `"DOWNLOAD_ABORTED"`, `"UNKNOWN"`\]

Defined in: [core/error.ts:23](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/error.ts#L23)

Every error code the library can raise.

Deliberately coarse. A distinct code earns its place only when an app can
genuinely recover differently from it (retry a download, wait for a busy
resource, re-create a disposed one). Everything else is a category that
exists so crash reporters can group failures, and the detail lives in the
message.
