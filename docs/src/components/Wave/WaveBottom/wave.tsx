import React from 'react';
import styles from './styles.module.css';
import useScreenSize from '@site/src/hooks/useScreenSize';

const WaveLight = (
  <svg
    className={styles.waveBottom}
    width="100%"
    viewBox="0 0 1440 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M-240 223.396C47.0486 129.764 212.33 345.91 550.798 270.102C759.335 223.396 780.428 195 1051.79 216.941C1344.23 240.587 1374.54 48.394 1617.32 10.4395C1647.62 5.69516 1680 0 1680 0V585C1680 585 63.4574 584.908 -240 585L-240 173.365"
      fill="url(#paint0_linear_568_554)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_568_554"
        x1="718.441"
        y1="-1.1828e-09"
        x2="718.562"
        y2="602.914"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#7394FF" />
        <stop offset="1" stop-color="#7394FF" />
      </linearGradient>
    </defs>
  </svg>
);

const WaveDark = (
  <svg
    className={styles.waveBottom}
    width="100%"
    viewBox="0 0 1440 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M-240 223.396C47.0486 129.764 212.33 345.91 550.798 270.102C759.335 223.396 780.428 195 1051.79 216.941C1344.23 240.587 1374.54 48.394 1617.32 10.4395C1647.62 5.69516 1680 0 1680 0V585C1680 585 63.4574 584.908 -240 585L-240 173.365"
      fill="url(#paint0_linear_494_1238)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_494_1238"
        x1="618.461"
        y1="-407.435"
        x2="2537.8"
        y2="1311.93"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#313C9C" />
        <stop offset="1" stop-color="#313C9C" />
      </linearGradient>
    </defs>
  </svg>
);

const WaveLightMobile = (
  <svg
    className={styles.waveBottom}
    width="100%"
    viewBox="0 0 390 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 38.2142C150.04 -12 247.111 67.8256 429.66 28.2142C539.28 4.42769 615.505 -5.5 767.818 28.2142C915.211 60.8391 893.644 25.6452 1023 0.5V160.5V553C1023 553 161.686 552.939 0 553V38.2142Z"
      fill="url(#paint0_linear_568_708)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_568_708"
        x1="718.441"
        y1="-40"
        x2="718.562"
        y2="195"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#7394FF" />
        <stop offset="1" stop-color="#7394FF" />
      </linearGradient>
    </defs>
  </svg>
);

const WaveDarkMobile = (
  <svg
    className={styles.waveBottom}
    width="100%"
    viewBox="0 0 390 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 38.2142C150.04 -12 247.111 67.8256 429.66 28.2142C539.28 4.42769 615.505 -5.5 767.818 28.2142C915.211 60.8391 893.644 25.6452 1023 0.5V160.5V553C1023 553 161.686 552.939 0 553V38.2142Z"
      fill="url(#paint0_linear_499_1287)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_499_1287"
        x1="457.399"
        y1="-384.3"
        x2="1925.69"
        y2="357.737"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#313C9C" />
        <stop offset="1" stop-color="#313C9C" />
      </linearGradient>
    </defs>
  </svg>
);

const Wave = ({ theme }) => {
  const { windowWidth } = useScreenSize();

  if (theme === 'dark') {
    return windowWidth > 768 ? WaveDark : WaveDarkMobile;
  }

  return windowWidth > 768 ? WaveLight : WaveLightMobile;
};

export default Wave;
