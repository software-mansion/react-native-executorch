# Type Alias: SpecMatch\<K\>

> **SpecMatch**\<`K`\> = `object`

Defined in: [core/schema.ts:786](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L786)

Result of validating an exported model spec against allowed variants.

## Type Parameters

### K

`K` _extends_ `PropertyKey` = `PropertyKey`

The variant key type.

## Properties

### dims

> **dims**: `object`

Defined in: [core/schema.ts:807](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L807)

Batch accessors for retrieving multiple symbol dimensions at once as typed tuples.

#### any()

> **any**\<`S`\>(...`names`): \{ \[I in string \| number \| symbol\]: ConcreteDim \}

Retrieves concrete dimension objects for multiple symbols.

##### Type Parameters

###### S

`S` _extends_ `string`[]

##### Parameters

###### names

...`S`

Symbol names to retrieve.

##### Returns

\{ \[I in string \| number \| symbol\]: ConcreteDim \}

A tuple of [ConcreteDim](ConcreteDim.md) objects corresponding to `names`.

##### Throws

With code `INVALID_ARGUMENT` if any
symbol is not found.

#### constant()

> **constant**\<`S`\>(...`names`): \{ \[I in string \| number \| symbol\]: number \}

Retrieves constant numeric values for multiple static symbols.

##### Type Parameters

###### S

`S` _extends_ `string`[]

##### Parameters

###### names

...`S`

Symbol names expected to be constant dimensions.

##### Returns

\{ \[I in string \| number \| symbol\]: number \}

A tuple of numbers corresponding to `names`.

##### Throws

With code `INVALID_ARGUMENT` if any
symbol is not found or is not a constant dimension.

#### dynamic()

> **dynamic**\<`S`\>(...`names`): \{ \[I in string \| number \| symbol\]: \{ kind: "range"; range: Range \} \| \{ choices: readonly number\[\]; kind: "enum" \} \}

Retrieves dynamic dimension objects (range or enum) for multiple symbols.

##### Type Parameters

###### S

`S` _extends_ `string`[]

##### Parameters

###### names

...`S`

Symbol names expected to be dynamic dimensions (range or enum).

##### Returns

\{ \[I in string \| number \| symbol\]: \{ kind: "range"; range: Range \} \| \{ choices: readonly number\[\]; kind: "enum" \} \}

A tuple of dynamic [ConcreteDim](ConcreteDim.md) objects corresponding to `names`.

##### Throws

With code `INVALID_ARGUMENT` if any
symbol is not found or is a constant dimension.

#### enum()

> **enum**\<`S`\>(...`names`): \{ \[I in string \| number \| symbol\]: readonly number\[\] \}

Retrieves choice arrays for multiple enumerated dynamic symbols.

##### Type Parameters

###### S

`S` _extends_ `string`[]

##### Parameters

###### names

...`S`

Symbol names expected to be enum dimensions.

##### Returns

\{ \[I in string \| number \| symbol\]: readonly number\[\] \}

A tuple of choice arrays corresponding to `names`.

##### Throws

With code `INVALID_ARGUMENT` if any
symbol is not found or is not an enum dimension.

#### range()

> **range**\<`S`\>(...`names`): \{ \[I in string \| number \| symbol\]: Range \}

Retrieves range objects for multiple dynamic symbols.

##### Type Parameters

###### S

`S` _extends_ `string`[]

##### Parameters

###### names

...`S`

Symbol names expected to be range dimensions.

##### Returns

\{ \[I in string \| number \| symbol\]: Range \}

A tuple of [Range](Range.md) objects corresponding to `names`.

##### Throws

With code `INVALID_ARGUMENT` if any
symbol is not found or is not a range dimension.

---

### variant

> `readonly` **variant**: `K`

Defined in: [core/schema.ts:788](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L788)

Key of the matched variant.

## Methods

### dim()

#### Call Signature

> **dim**(`name`, `kind`): `number`

Defined in: [core/schema.ts:798](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L798)

Returns the concrete value for a symbol.

##### Parameters

###### name

`string`

The symbol name.

###### kind

`"constant"`

Expected dimension kind — determines the return type. Omit to
get the raw [ConcreteDim](ConcreteDim.md) when the kind is not known upfront.

##### Returns

`number`

##### Throws

With code `INVALID_ARGUMENT` if the
symbol is not found or has a different kind.

#### Call Signature

> **dim**(`name`, `kind`): [`Range`](Range.md)

Defined in: [core/schema.ts:799](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L799)

##### Parameters

###### name

`string`

###### kind

`"range"`

##### Returns

[`Range`](Range.md)

#### Call Signature

> **dim**(`name`, `kind`): readonly `number`[]

Defined in: [core/schema.ts:800](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L800)

##### Parameters

###### name

`string`

###### kind

`"enum"`

##### Returns

readonly `number`[]

#### Call Signature

> **dim**(`name`, `kind`): \{ `kind`: `"range"`; `range`: [`Range`](Range.md); \} \| \{ `choices`: readonly `number`[]; `kind`: `"enum"`; \}

Defined in: [core/schema.ts:801](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L801)

##### Parameters

###### name

`string`

###### kind

`"dynamic"`

##### Returns

\{ `kind`: `"range"`; `range`: [`Range`](Range.md); \} \| \{ `choices`: readonly `number`[]; `kind`: `"enum"`; \}

#### Call Signature

> **dim**(`name`): [`ConcreteDim`](ConcreteDim.md)

Defined in: [core/schema.ts:802](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/schema.ts#L802)

##### Parameters

###### name

`string`

##### Returns

[`ConcreteDim`](ConcreteDim.md)
