import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';
import Wave from './wave';

const WaveTop = () => {
  const theme = useColorMode().colorMode;
  return <BrowserOnly>{() => <Wave theme={theme} />}</BrowserOnly>;
};

export default WaveTop;
