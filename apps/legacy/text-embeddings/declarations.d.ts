declare module '*.svg' {
  import { SvgProps } from 'react-native-svg';
  const content: React.FV<SvgProps>;
  export default content;
}
