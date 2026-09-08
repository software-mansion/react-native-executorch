# Variable: constraint

> `const` **constraint**: `object`

Defined in: [core/schema.ts:379](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L379)

Helper namespace for declaring runtime constraints.

## Type Declaration

### equality()

> **equality**: (...`dims`) => [`EqualityConstraint`](../type-aliases/EqualityConstraint.md)

Declares that all given dimensions must be equal at runtime.

#### Parameters

##### dims

...[`DimRef`](../type-aliases/DimRef.md)[]

Dimensions that must share the same concrete value.

#### Returns

[`EqualityConstraint`](../type-aliases/EqualityConstraint.md)

An [EqualityConstraint](../type-aliases/EqualityConstraint.md) across the given dimensions.

### linear()

> **linear**: (`dimLhs`, `dimRhs`, `a`, `b`) => [`LinearConstraint`](../type-aliases/LinearConstraint.md)

Declares a linear relation between two dimensions: `dimLhs = a * dimRhs +
b`.

#### Parameters

##### dimLhs

[`DimRef`](../type-aliases/DimRef.md)

The left-hand-side dimension.

##### dimRhs

[`DimRef`](../type-aliases/DimRef.md)

The right-hand-side dimension.

##### a

`number`

Slope coefficient.

##### b?

`number` = `0`

Intercept coefficient (defaults to `0`).

#### Returns

[`LinearConstraint`](../type-aliases/LinearConstraint.md)

A [LinearConstraint](../type-aliases/LinearConstraint.md) relating the two dimensions.
