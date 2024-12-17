import { Platform } from 'react-native';

export const efficientnet_v2_s =
  Platform.OS === 'ios'
    ? require('../assets/classification/ios/efficientnet_v2_s_coreml_all.pte')
    : require('../assets/classification/android/efficientnet_v2_s_xnnpack.pte');
