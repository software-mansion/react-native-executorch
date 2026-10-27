# Function: setTelemetryEnabled()

> **setTelemetryEnabled**(`enabled`): `void`

Defined in: [fetcher/telemetry.ts:33](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/fetcher/telemetry.ts#L33)

Enables or disables the anonymous download analytics sent to Software Mansion.
Analytics are enabled by default; call `setTelemetryEnabled(false)` (e.g. once
at app startup) to opt out. This does not affect the Hugging Face download
counter, a standard model-download stat that always fires.

## Parameters

### enabled

`boolean`

Whether to send anonymous download analytics.

## Returns

`void`
