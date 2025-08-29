import React from 'react';
import styles from './styles.module.css';
import HomepageButton from '@site/src/components/HomepageButton';
import ReactNativeExecuTorchFeatureList from '@site/src/components/ReactNativeExecuTorchFeatures/ReactNativeExecuTorchFeatureList';
import Slider from 'react-slick';

const settings = {
  className: 'center',
  centerMode: true,
  infinite: true,
  centerPadding: '60px',
  slidesToShow: 3,
  speed: 500,
};

const ReactNativeExecuTorchFeatures = () => {
  return (
    <div className={styles.featuresContainer}>
      <h2 className={styles.title}>Why React Native ExecuTorch?</h2>
      <ReactNativeExecuTorchFeatureList />
      <>
        <div className="slider-container">
          <Slider {...settings}>
            <div>
              <h3>1sdfasfsadf</h3>
            </div>
            <div>
              <h3>2sdfsafasdfsddfs</h3>
            </div>
            <div>
              <h3>sdfasfasdfsdfsdfs</h3>
            </div>
            <div>
              <h3>4safsdfsafdsadf</h3>
            </div>
            <div>
              <h3>5asdfsdafsfd</h3>
            </div>
            <div>
              <h3>6</h3>
            </div>
          </Slider>
        </div>
      </>
      <div className={styles.learnMoreSection}>
        <p>Learn more about React Native ExecuTorch</p>
        <HomepageButton
          target="_blank"
          href="https://blog.swmansion.com/introducing-react-native-executorch-2bdb87592884"
          title="See blog post"
          backgroundStyling={styles.featuresButton}
        />
      </div>
    </div>
  );
};

export default ReactNativeExecuTorchFeatures;
