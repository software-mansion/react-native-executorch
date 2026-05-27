# Variable: isAvailable

> `const` **isAvailable**: `boolean`

Defined in: [index.ts:164](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/index.ts#L164)

Whether the native ExecuTorch runtime is available on this device.
Returns `false` when native libraries cannot be loaded (e.g. 32-bit Android
devices where only arm64-v8a binaries are shipped).
