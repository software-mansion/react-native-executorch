# Type Alias: RuntimeConstraint

> **RuntimeConstraint** = [`LinearConstraint`](LinearConstraint.md) \| [`EqualityConstraint`](EqualityConstraint.md)

Defined in: [core/schema.ts:191](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L191)

A requirement on the runtime values of a method's tensor dimensions: the
concrete tensors passed to and produced by the method must satisfy it in
any given execution. Matched as a declaration during spec validation.
