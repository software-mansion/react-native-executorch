# Enumeration: ScalarType

Defined in: [types/common.ts:15](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L15)

Enum representing the scalar types of tensors.

## Enumeration Members

### BITS16

> **BITS16**: `22`

Defined in: [types/common.ts:75](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L75)

Raw Bits type.

***

### BOOL

> **BOOL**: `11`

Defined in: [types/common.ts:51](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L51)

Boolean type.

***

### BYTE

> **BYTE**: `0`

Defined in: [types/common.ts:19](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L19)

Byte type (8-bit unsigned integer).

***

### CHAR

> **CHAR**: `1`

Defined in: [types/common.ts:23](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L23)

Character type (8-bit signed integer).

***

### DOUBLE

> **DOUBLE**: `7`

Defined in: [types/common.ts:47](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L47)

Double-precision floating point type (64-bit).

***

### FLOAT

> **FLOAT**: `6`

Defined in: [types/common.ts:43](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L43)

Single-precision floating point type (32-bit).

***

### FLOAT8E4M3FN

> **FLOAT8E4M3FN**: `24`

Defined in: [types/common.ts:83](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L83)

Quantized 8-bit floating point type: Sign bit, 4 Exponent bits, 3 Mantissa bits.

***

### FLOAT8E4M3FNUZ

> **FLOAT8E4M3FNUZ**: `26`

Defined in: [types/common.ts:91](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L91)

Quantized 8-bit floating point type with No Unsigned Zero (NUZ): Sign bit, 4 Exponent bits, 3 Mantissa bits.

***

### FLOAT8E5M2

> **FLOAT8E5M2**: `23`

Defined in: [types/common.ts:79](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L79)

Quantized 8-bit floating point type: Sign bit, 5 Exponent bits, 2 Mantissa bits.

***

### FLOAT8E5M2FNUZ

> **FLOAT8E5M2FNUZ**: `25`

Defined in: [types/common.ts:87](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L87)

Quantized 8-bit floating point type with No Unsigned Zero (NUZ): Sign bit, 5 Exponent bits, 2 Mantissa bits.

***

### HALF

> **HALF**: `5`

Defined in: [types/common.ts:39](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L39)

Half-precision floating point type (16-bit).

***

### INT

> **INT**: `3`

Defined in: [types/common.ts:31](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L31)

Integer type (32-bit signed integer).

***

### LONG

> **LONG**: `4`

Defined in: [types/common.ts:35](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L35)

Long integer type (64-bit signed integer).

***

### QINT32

> **QINT32**: `14`

Defined in: [types/common.ts:63](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L63)

Quantized 32-bit signed integer type.

***

### QINT8

> **QINT8**: `12`

Defined in: [types/common.ts:55](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L55)

Quantized 8-bit signed integer type.

***

### QUINT2X4

> **QUINT2X4**: `17`

Defined in: [types/common.ts:71](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L71)

Packed Quantized Unsigned 2-bit Integer type (4 numbers in 1 byte).

***

### QUINT4X2

> **QUINT4X2**: `16`

Defined in: [types/common.ts:67](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L67)

Packed Quantized Unsigned 4-bit Integers type (2 number in 1 byte).

***

### QUINT8

> **QUINT8**: `13`

Defined in: [types/common.ts:59](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L59)

Quantized 8-bit unsigned integer type.

***

### SHORT

> **SHORT**: `2`

Defined in: [types/common.ts:27](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L27)

Short integer type (16-bit signed integer).

***

### UINT16

> **UINT16**: `27`

Defined in: [types/common.ts:95](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L95)

Unsigned 16-bit integer type.

***

### UINT32

> **UINT32**: `28`

Defined in: [types/common.ts:99](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L99)

Unsigned 32-bit integer type.

***

### UINT64

> **UINT64**: `29`

Defined in: [types/common.ts:103](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/common.ts#L103)

Unsigned 64-bit integer type.
