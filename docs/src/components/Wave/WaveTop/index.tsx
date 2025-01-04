import React from 'react';
import useScreenSize from '@site/src/hooks/useScreenSize';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';
import { WaveLight, WaveDark, WaveLightMobile, WaveDarkMobile } from './waves';

const WaveTop = () => {
  const theme = useColorMode().colorMode;

  return (
    <BrowserOnly>
      {() => {
        const { windowWidth } = useScreenSize();

        if (theme === 'dark') {
          return windowWidth > 768
            ? WaveDark(windowWidth)
            : WaveDarkMobile(windowWidth);
        }

        return windowWidth > 768
          ? WaveLight(windowWidth)
          : WaveLightMobile(windowWidth);
      }}
    </BrowserOnly>
  );
};

export default WaveTop;
