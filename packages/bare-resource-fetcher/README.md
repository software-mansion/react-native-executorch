# @react-native-executorch/bare-resource-fetcher

Bare React Native adapter for `react-native-executorch` that provides resource fetching capabilities using native filesystem libraries.

## Installation

```bash
yarn add @react-native-executorch/bare-resource-fetcher
yarn add @dr.pogodin/react-native-fs @kesha-antonov/react-native-background-downloader
```

### Native Dependencies Setup

After installing, follow the setup guides for the native dependencies:

- **[@dr.pogodin/react-native-fs](https://github.com/birdofpreyru/react-native-fs#getting-started)** - Filesystem operations
- **[@kesha-antonov/react-native-background-downloader](https://github.com/kesha-antonov/react-native-background-downloader#bare-react-native-projects)** - Background download support

> **Note**: Make sure to complete the native setup (iOS/Android configuration) for both dependencies before using this adapter.

## Usage

```typescript
import { initExecutorch } from 'react-native-executorch';
import { BareResourceFetcher } from '@react-native-executorch/bare-resource-fetcher';

initExecutorch({
  resourceFetcher: BareResourceFetcher,
});
```

## When to Use

Use this adapter if you're working with:
- Bare React Native projects (created with `npx @react-native-community/cli@latest init`)
- Projects that need true background downloads
- Projects requiring direct native filesystem access
