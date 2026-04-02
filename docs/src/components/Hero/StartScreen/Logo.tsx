import React from 'react';
import useScreenSize from '@site/src/hooks/useScreenSize';
import LogoIcon from '@site/static/img/logo-hero.svg';

const Logo = () => {
  const { windowWidth } = useScreenSize();

  if (windowWidth <= 768) {
    return null;
  }

  return <LogoIcon />;
};

export default Logo;
