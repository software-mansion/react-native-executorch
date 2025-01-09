import React from 'react';
import { TOCItems } from '@swmansion/t-rex-ui';
import styles from './styles.module.css';

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
