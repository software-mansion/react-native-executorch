// Side-effect import that registers the bare React Native resource
// fetcher with react-native-executorch on import. Saves the boilerplate
// `initExecutorch({ resourceFetcher: BareResourceFetcher })` call at
// app entry. Use this when you have nothing custom to configure:
//
//     import 'react-native-executorch-bare-resource-fetcher/auto';
//
// Stick with the explicit `initExecutorch(...)` call from the package's
// main entry if you need to register a different adapter, swap adapters
// at runtime, or order the registration relative to other side effects.

import { initExecutorch } from 'react-native-executorch';
import { BareResourceFetcher } from './ResourceFetcher';

initExecutorch({ resourceFetcher: BareResourceFetcher });
