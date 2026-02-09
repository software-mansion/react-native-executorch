import React from 'react';
import styles from './styles.module.css';

import ArrowRight from '@site/static/img/arrow-right-hero.svg';
import clsx from 'clsx';

const HireUsButton: React.FC<{
  title: string;
  href: string;
  target?: '_blank' | '_parent' | '_self' | '_top';
  backgroundStyling?: string;
  borderStyling?: string;
}> = ({ title, href, target = '_self', backgroundStyling, borderStyling }) => {
  return (
    <a href={href} target={target} className={styles.hireUsButtonLink}>
      <div
        className={clsx(styles.hireUsButton, backgroundStyling, borderStyling)}
      >
        {title}
        <div className={styles.arrow}>
          <ArrowRight />
        </div>
      </div>
    </a>
  );
};

export default HireUsButton;
