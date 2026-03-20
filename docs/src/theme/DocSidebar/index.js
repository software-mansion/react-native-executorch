import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { DocSidebar } from '@swmansion/t-rex-ui';

export default function DocSidebarWrapper(props) {
  const titleImages = {
    light: useBaseUrl('/img/title-flame.svg'),
    dark: useBaseUrl('/img/title-flame-dark.svg'),
  };

  const heroImages = {
    logo: useBaseUrl('/img/logo-hero-flame.png'),
    title: useBaseUrl('/img/title-flame.svg'),
  };
  return (
    <DocSidebar heroImages={heroImages} titleImages={titleImages} {...props} />
  );
}
