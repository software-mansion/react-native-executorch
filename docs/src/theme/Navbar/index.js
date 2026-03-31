import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { Navbar } from '@swmansion/t-rex-ui';

export default function NavbarWrapper(props) {
  const titleImages = {
    light: useBaseUrl('/img/title-flame.svg'),
    dark: useBaseUrl('/img/title-flame-dark.svg'),
  };

  const heroImages = {
    logo: useBaseUrl('/img/logo-hero-flame.png'),
  };
  return (
    <Navbar heroImages={heroImages} titleImages={titleImages} {...props} />
  );
}
