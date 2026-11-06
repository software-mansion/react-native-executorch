import React, { useEffect, useRef, useState } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

import styles from './styles.module.css';

function ShowcaseVideo({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (typeof IntersectionObserver === 'undefined') {
      setLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || !loaded) return;
    // Playback can be blocked by browser autoplay settings.
    const play = () => {
      video.play().catch(() => {});
    };
    if (typeof IntersectionObserver === 'undefined') {
      play();
      return () => video.pause();
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) play();
      else video.pause();
    });
    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [loaded]);

  return (
    <video
      ref={ref}
      src={loaded ? src : undefined}
      aria-label={label}
      loop
      muted
      playsInline
      preload="metadata"
    />
  );
}

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
        { name: 'iOS', platform: 'iphone', src: ios },
        { name: 'Android', platform: 'pixel', src: android },
      ].map(({ name, platform, src }) => (
        <figure key={platform} className={styles.device}>
          <figcaption>{name}</figcaption>
          <div className={`${styles.phone} ${styles[platform]}`}>
            <div className={styles.screen}>
              <ShowcaseVideo
                key={src}
                src={src}
                label={`${task.replaceAll('-', ' ')} on ${name}`}
              />
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
