# @react-native-executorch/expo-resource-fetcher

Expo adapter for `react-native-executorch` that provides resource fetching capabilities using Expo's filesystem APIs.

## Installation

```bash
yarn add @react-native-executorch/expo-resource-fetcher
yarn add expo-file-system expo-asset
```

## Usage

```typescript
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from '@react-native-executorch/expo-resource-fetcher';

initExecutorch({
  resourceFetcher: ExpoResourceFetcher,
});
```

## When to Use

Use this adapter if you're working with:
- Expo projects
- Expo Router projects
- Projects using Expo managed workflow

This adapter leverages `expo-file-system` and `expo-asset` to handle file operations and downloads.
