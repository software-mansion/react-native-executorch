# Type Alias: MethodProfile

> **MethodProfile** = `object`

Defined in: [core/profiler.ts:25](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/profiler.ts#L25)

Accumulated `execute` totals of one exported method.

## Properties

### count

> `readonly` **count**: `number`

Defined in: [core/profiler.ts:27](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/profiler.ts#L27)

Number of `execute` calls.

---

### totalMs

> `readonly` **totalMs**: `number`

Defined in: [core/profiler.ts:29](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/profiler.ts#L29)

Total time spent in those calls, in milliseconds (fractional).
