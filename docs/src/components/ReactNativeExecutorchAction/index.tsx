import React from 'react';
import styles from './styles.module.css';
import AppStore from '@site/static/img/download_app_store.svg';
import PlayStore from '@site/static/img/download_play_store.svg';
import PrivateMind from '@site/static/img/private-mind.svg';

const ReactNativeExecutorchAction = () => {
  return (
    <div className={styles.featuresContainer}>
      <h2 className={styles.title}>
        Want to see our React Native LLMs in action?
      </h2>
      <div className={styles.innerContainer}>
        <div className={styles.introduction}>
          <p>
            Download Private Mind – our on-device AI chatbot that works entirely
            offline.
          </p>
          With Private Mind you can:
          <div className={styles.introduction}>
            <li className={styles.listItem}>
              Chat freely with no restrictions.
            </li>
            <li className={styles.listItem}>
              Keep your data safe and private.
            </li>
            <li className={styles.listItem}>
              Browse, test, and benchmark local language models.
            </li>
            <li className={styles.listItem}>
              Customize AI assistants to match your workflow and style.
            </li>
          </div>
        </div>
        <div className={styles.imageOuterContainer}>
          <div className={styles.imageInnerContainer}>
            <PrivateMind height="100%" width="100%" />
          </div>
          <div style={{ display: 'flex', width: '100%' }}>
            <div className={styles.downloadInnerContainer}>
              <div className={styles.appStore}>
                <a href="https://apps.apple.com/pl/app/private-mind/id6746713439">
                  <AppStore height={'80px'} width={''} />
                </a>
              </div>
              <div className={styles.playStore}>
                <a href="https://play.google.com/store/apps/details?id=com.swmansion.privatemind">
                  <PlayStore height={'120px'} width={''} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReactNativeExecutorchAction;
