# Type Alias: RuntimeConstraint

> **RuntimeConstraint** = [`LinearConstraint`](LinearConstraint.md) \| [`EqualityConstraint`](EqualityConstraint.md)

Defined in: [core/schema.ts:191](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/core/schema.ts#L191)

A requirement on the runtime values of a method's tensor dimensions: the
concrete tensors passed to and produced by the method must satisfy it in
any given execution. Matched as a declaration during spec validation.
