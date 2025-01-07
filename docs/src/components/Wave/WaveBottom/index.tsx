import React from 'react';
import useScreenSize from '@site/src/hooks/useScreenSize';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';
import { WaveLight, WaveDark, WaveLightMobile, WaveDarkMobile } from './waves';

const WaveBottom = () => {
  const theme = useColorMode().colorMode;

  return (
    <BrowserOnly>
      {() => {
        const { windowWidth } = useScreenSize();

        if (theme === 'dark') {
          return windowWidth > 768 ? WaveDark() : WaveDarkMobile();
        }

        return windowWidth > 768 ? WaveLight() : WaveLightMobile();
      }}
    </BrowserOnly>
  );
};

export default WaveBottom;
