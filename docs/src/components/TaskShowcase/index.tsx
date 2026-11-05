import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

import styles from './styles.module.css';

/**
 * Paired recordings framed for the iPhone 17 and Pixel 10 used to capture them.
 * @param props - Recording basename shared by the two platform exports.
 * @returns The labeled pair of phone previews.
 */
export default function TaskShowcase(props: { task: string }) {
  const { task } = props;
  const ios = useBaseUrl(`/media/gallery/${task}-ios.mp4`);
  const android = useBaseUrl(`/media/gallery/${task}-android.mp4`);
  return (
    <div className={styles.showcase}>
      {[
        { name: 'iPhone 17 · iOS', platform: 'iphone', src: ios },
        { name: 'Pixel 10 · Android', platform: 'pixel', src: android },
      ].map(({ name, platform, src }) => (
        <figure key={platform} className={styles.device}>
          <figcaption>{name}</figcaption>
          <div className={`${styles.phone} ${styles[platform]}`}>
            <div className={styles.screen}>
              <video
                src={src}
                aria-label={`${task.replaceAll('-', ' ')} on ${name}`}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />
            </div>
            {platform === 'pixel' && <div className={styles.camera} aria-hidden="true" />}
            {platform === 'iphone' && <div className={styles.island} aria-hidden="true" />}
          </div>
        </figure>
      ))}
    </div>
  );
}
