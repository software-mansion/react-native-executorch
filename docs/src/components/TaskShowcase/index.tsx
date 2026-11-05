import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

import styles from './styles.module.css';

/**
 * Paired recordings framed for the iPhone 17 and Pixel 10 used to capture them.
 * @param props - Recording basename shared by the two platform exports.
 * @returns The labeled pair of phone previews.
 */
export default function TaskShowcase(props: { task: string; format?: 'mp4' | 'gif' }) {
  const { task, format = 'mp4' } = props;
  const ios = useBaseUrl(`/media/gallery/${task}-ios.${format}`);
  const android = useBaseUrl(`/media/gallery/${task}-android.${format}`);
  return (
    <div className={styles.showcase}>
      {[
        { name: 'iOS', platform: 'iphone', src: ios },
        { name: 'Android', platform: 'pixel', src: android },
      ].map(({ name, platform, src }) => (
        <figure key={platform} className={styles.device}>
          <figcaption>{name}</figcaption>
          <div className={`${styles.phone} ${styles[platform]}`}>
            <div className={styles.screen}>
              {format === 'gif' ? (
                <img src={src} alt={`${task.replaceAll('-', ' ')} on ${name}`} loading="lazy" />
              ) : (
                <video
                  src={src}
                  aria-label={`${task.replaceAll('-', ' ')} on ${name}`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                />
              )}
            </div>
            <div className={styles.buttons} aria-hidden="true">
              {platform === 'iphone' ? (
                <>
                  <span className={styles.action} />
                  <span className={styles.volumeUp} />
                  <span className={styles.volumeDown} />
                  <span className={styles.power} />
                  <span className={styles.cameraControl} />
                </>
              ) : (
                <>
                  <span className={styles.power} />
                  <span className={styles.volumeRocker} />
                </>
              )}
            </div>
            {platform === 'pixel' && <div className={styles.camera} aria-hidden="true" />}
            {platform === 'iphone' && <div className={styles.island} aria-hidden="true" />}
          </div>
        </figure>
      ))}
    </div>
  );
}
