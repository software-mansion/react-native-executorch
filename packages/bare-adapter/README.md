# @rn-executorch/bare-adapter

Bare React Native adapter for `react-native-executorch` that provides resource fetching capabilities using native filesystem libraries.

## Installation

```bash
yarn add @rn-executorch/bare-adapter
yarn add @dr.pogodin/react-native-fs @kesha-antonov/react-native-background-downloader
```

## Usage

```typescript
import { initExecutorch } from 'react-native-executorch';
import { BareResourceFetcher } from '@rn-executorch/bare-adapter';

initExecutorch({
  resourceFetcher: BareResourceFetcher,
});
```

## When to Use

Use this adapter if you're working with:
- Bare React Native projects (created with `npx @react-native-community/cli@latest init`)
- Projects that need true background downloads
- Projects requiring direct native filesystem access

This adapter uses `@dr.pogodin/react-native-fs` and `@kesha-antonov/react-native-background-downloader` for enhanced file operations and background download support.
