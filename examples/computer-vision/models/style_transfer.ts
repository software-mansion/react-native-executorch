import { Platform } from 'react-native';

export const candy =
  Platform.OS === 'ios'
    ? require('../assets/style_transfer/ios/__candy_coreml_all.pte')
    : require('../assets/style_transfer/android/candy_xnnpack_640_fp32.pte');
