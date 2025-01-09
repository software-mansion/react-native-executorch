import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';
import Wave from './wave';

const WaveBottom = () => {
  const theme = useColorMode().colorMode;

  return <BrowserOnly>{() => <Wave theme={theme} />}</BrowserOnly>;
};

export default WaveBottom;
