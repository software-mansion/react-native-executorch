# Enumeration: RnExecutorchErrorCode

Defined in: [errors/ErrorCodes.ts:4](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L4)

## Enumeration Members

### AccessFailed

> **AccessFailed**: `34`

Defined in: [errors/ErrorCodes.ts:168](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L168)

Could not access a resource.

---

### AlreadyLoaded

> **AlreadyLoaded**: `4`

Defined in: [errors/ErrorCodes.ts:136](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L136)

Status indicating a resource has already been loaded.

---

### DelegateInvalidCompatibility

> **DelegateInvalidCompatibility**: `48`

Defined in: [errors/ErrorCodes.ts:184](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L184)

Init stage: Backend receives an incompatible delegate version.

---

### DelegateInvalidHandle

> **DelegateInvalidHandle**: `50`

Defined in: [errors/ErrorCodes.ts:192](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L192)

Execute stage: The handle is invalid.

---

### DelegateMemoryAllocationFailed

> **DelegateMemoryAllocationFailed**: `49`

Defined in: [errors/ErrorCodes.ts:188](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L188)

Init stage: Backend fails to allocate memory.

---

### DownloadInterrupted

> **DownloadInterrupted**: `118`

Defined in: [errors/ErrorCodes.ts:52](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L52)

Thrown when the number of downloaded files is unexpected, due to download interruptions.

---

### EndOfMethod

> **EndOfMethod**: `3`

Defined in: [errors/ErrorCodes.ts:132](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L132)

Status indicating there are no more steps of execution to run

---

### FileReadFailed

> **FileReadFailed**: `114`

Defined in: [errors/ErrorCodes.ts:36](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L36)

Thrown when a file read operation failed. This could be invalid image url passed to image models, or unsupported format.

---

### FileWriteFailed

> **FileWriteFailed**: `103`

Defined in: [errors/ErrorCodes.ts:16](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L16)

An error ocurred when saving a file. This could be, for instance a result image from an image model.

---

### Internal

> **Internal**: `1`

Defined in: [errors/ErrorCodes.ts:124](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L124)

An internal error occurred.

---

### InvalidArgument

> **InvalidArgument**: `18`

Defined in: [errors/ErrorCodes.ts:148](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L148)

User provided an invalid argument.

---

### InvalidConfig

> **InvalidConfig**: `112`

Defined in: [errors/ErrorCodes.ts:28](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L28)

Thrown when config parameters passed to a model are invalid. For example, when LLM's topp is outside of range [0, 1].

---

### InvalidExternalData

> **InvalidExternalData**: `36`

Defined in: [errors/ErrorCodes.ts:176](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L176)

Error caused by the contents of external data.

---

### InvalidModelOutput

> **InvalidModelOutput**: `115`

Defined in: [errors/ErrorCodes.ts:40](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L40)

Thrown when the size of model output is unexpected. If you're using your custom model with any of the pre-defined modules, please verify docs or source code for the expected model I/O contract.

---

### InvalidModelSource

> **InvalidModelSource**: `120`

Defined in: [errors/ErrorCodes.ts:60](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L60)

Thrown when the type of model source passed by the user is invalid.

---

### InvalidProgram

> **InvalidProgram**: `35`

Defined in: [errors/ErrorCodes.ts:172](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L172)

Error caused by the contents of a program.

---

### InvalidState

> **InvalidState**: `2`

Defined in: [errors/ErrorCodes.ts:128](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L128)

Status indicating the executor is in an invalid state for a targeted operation.

---

### InvalidType

> **InvalidType**: `19`

Defined in: [errors/ErrorCodes.ts:152](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L152)

Object is an invalid type for the operation.

---

### InvalidUserInput

> **InvalidUserInput**: `117`

Defined in: [errors/ErrorCodes.ts:48](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L48)

Thrown when the input passed to our APIs is invalid, for example when passing an empty message array to LLM's generate().

---

### LanguageNotSupported

> **LanguageNotSupported**: `105`

Defined in: [errors/ErrorCodes.ts:24](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L24)

Thrown when a language is passed to a multi-language model that is not supported. For example OCR or Speech To Text.

---

### MemoryAllocationFailed

> **MemoryAllocationFailed**: `33`

Defined in: [errors/ErrorCodes.ts:164](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L164)

Could not allocate the requested memory.

---

### MissingDataChunk

> **MissingDataChunk**: `161`

Defined in: [errors/ErrorCodes.ts:76](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L76)

Thrown when streaming transcription is attempted but audio data chunk is missing.

---

### ModelGenerating

> **ModelGenerating**: `104`

Defined in: [errors/ErrorCodes.ts:20](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L20)

Thrown when a user tries to run a model that is currently processing. It is only allowed to run a single model prediction at a time.

---

### ModuleNotLoaded

> **ModuleNotLoaded**: `102`

Defined in: [errors/ErrorCodes.ts:12](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L12)

Thrown when a user tries to run a model that is not yet downloaded or loaded into memory.

---

### MultilingualConfiguration

> **MultilingualConfiguration**: `160`

Defined in: [errors/ErrorCodes.ts:72](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L72)

Thrown when there's a configuration mismatch between multilingual and language settings in Speech-to-Text models.

---

### NotFound

> **NotFound**: `32`

Defined in: [errors/ErrorCodes.ts:160](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L160)

Requested resource could not be found.

---

### NotImplemented

> **NotImplemented**: `17`

Defined in: [errors/ErrorCodes.ts:144](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L144)

Operation is not yet implemented.

---

### NotSupported

> **NotSupported**: `16`

Defined in: [errors/ErrorCodes.ts:140](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L140)

Operation is not supported in the current context.

---

### Ok

> **Ok**: `0`

Defined in: [errors/ErrorCodes.ts:120](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L120)

Status indicating a successful operation.

---

### OperatorMissing

> **OperatorMissing**: `20`

Defined in: [errors/ErrorCodes.ts:156](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L156)

Operator(s) missing in the operator registry.

---

### OutOfResources

> **OutOfResources**: `37`

Defined in: [errors/ErrorCodes.ts:180](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L180)

Does not have enough resources to perform the requested operation.

---

### PlatformNotSupported

> **PlatformNotSupported**: `119`

Defined in: [errors/ErrorCodes.ts:56](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L56)

Thrown when a feature or platform is not supported in the current environment.

---

### ResourceFetcherAdapterNotInitialized

> **ResourceFetcherAdapterNotInitialized**: `186`

Defined in: [errors/ErrorCodes.ts:112](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L112)

Thrown when trying to load resources without fetcher initialization.

---

### ResourceFetcherAlreadyOngoing

> **ResourceFetcherAlreadyOngoing**: `183`

Defined in: [errors/ErrorCodes.ts:100](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L100)

Thrown when trying to resume a download that is already ongoing.

---

### ResourceFetcherAlreadyPaused

> **ResourceFetcherAlreadyPaused**: `182`

Defined in: [errors/ErrorCodes.ts:96](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L96)

Thrown when trying to pause a download that is already paused.

---

### ResourceFetcherDownloadFailed

> **ResourceFetcherDownloadFailed**: `180`

Defined in: [errors/ErrorCodes.ts:88](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L88)

Thrown when a resource fails to download. This could be due to invalid URL, or for example a network problem.

---

### ResourceFetcherDownloadInProgress

> **ResourceFetcherDownloadInProgress**: `181`

Defined in: [errors/ErrorCodes.ts:92](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L92)

Thrown when a user tries to trigger a download that's already in progress.

---

### ResourceFetcherMissingUri

> **ResourceFetcherMissingUri**: `185`

Defined in: [errors/ErrorCodes.ts:108](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L108)

Thrown when required URI information is missing for a download operation.

---

### ResourceFetcherNotActive

> **ResourceFetcherNotActive**: `184`

Defined in: [errors/ErrorCodes.ts:104](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L104)

Thrown when trying to pause, resume, or cancel a download that is not active.

---

### ResourceFetcherPlatformNotSupported

> **ResourceFetcherPlatformNotSupported**: `187`

Defined in: [errors/ErrorCodes.ts:116](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L116)

Thrown when the platform does not support the resource fetching feature, which is required for downloading models and other resources in React Native ExecuTorch.

---

### StreamingInProgress

> **StreamingInProgress**: `163`

Defined in: [errors/ErrorCodes.ts:84](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L84)

Thrown when trying to start a new streaming session while another is already in progress.

---

### StreamingNotStarted

> **StreamingNotStarted**: `162`

Defined in: [errors/ErrorCodes.ts:80](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L80)

Thrown when trying to stop or insert data into a stream that hasn't been started.

---

### ThreadPoolError

> **ThreadPoolError**: `113`

Defined in: [errors/ErrorCodes.ts:32](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L32)

Thrown when React Native ExecuTorch threadpool problem occurs.

---

### TokenizerError

> **TokenizerError**: `122`

Defined in: [errors/ErrorCodes.ts:68](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L68)

Thrown when an error occurs with the tokenizer or tokenization process.

---

### UnexpectedNumInputs

> **UnexpectedNumInputs**: `121`

Defined in: [errors/ErrorCodes.ts:64](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L64)

Thrown when the number of passed inputs to the model is different than the model metadata specifies. If you're using your custom model with any of the pre-defined modules, please verify docs or source code for the expected model I/O contract.

---

### UnknownError

> **UnknownError**: `101`

Defined in: [errors/ErrorCodes.ts:8](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L8)

An umbrella-error that is thrown usually when something unexpected happens, for example a 3rd-party library error.

---

### WrongDimensions

> **WrongDimensions**: `116`

Defined in: [errors/ErrorCodes.ts:44](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/errors/ErrorCodes.ts#L44)

Thrown when the dimensions of input tensors don't match the model's expected dimensions.
