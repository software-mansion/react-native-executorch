import React from 'react';
import { TOCItems } from '@swmansion/t-rex-ui';
import styles from './styles.module.css';
import HireUsButton from './HireUsButton';

const TOCItemsWrapper = ({
  toc,
  className = 'table-of-contents table-of-contents__left-border',
  linkClassName = 'table-of-contents__link',
  linkActiveClassName = undefined,
  minHeadingLevel: minHeadingLevelOption,
  maxHeadingLevel: maxHeadingLevelOption,
  ...props
}) => {
  return (
    <div className={styles.TOCItemsWrapper}>
      <TOCItems
        toc={toc}
        slot={
          <div className={styles.hireUsContainer}>
            <p>We are Software Mansion.</p>
            <div className={styles.buttonContainer}>
              <HireUsButton
                href="https://swmansion.com/contact?utm_source=react-native-executorch&utm_medium=sidebar"
                title="Hire us"
                backgroundStyling={styles.buttonTOCStyling}
                borderStyling={styles.buttonTOCBorderStyling}
              />
            </div>
          </div>
        }
        className={className}
        linkClassName={linkClassName}
        linkActiveClassName={linkActiveClassName}
        minHeadingLevel={minHeadingLevelOption}
        maxHeadingLevel={maxHeadingLevelOption}
        {...props}
      />
    </div>
  );
};

export default TOCItemsWrapper;
