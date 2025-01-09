import React from 'react';
import styles from './styles.module.css';
import useScreenSize from '@site/src/hooks/useScreenSize';

const WaveLight = (
  <svg
    className={styles.wave}
    width="100%"
    viewBox="0 0 1440 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clip-path="url(#clip0_2020_324)">
      <path
        d="M-240 344.114C-122.485 62.6994 333.195 289.04 550.509 138.352C876.604 -87.7728 995.042 196.141 1302.39 105.555C1492.76 49.4634 1495.7 -221.523 1680 -233V2027H-240L-240 344.114Z"
        fill="url(#paint0_linear_2020_324)"
      />
    </g>
    <defs>
      <linearGradient
        id="paint0_linear_2020_324"
        x1="718.441"
        y1="-233"
        x2="720.244"
        y2="1903.04"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#7394FF" />
        <stop offset="1" stop-color="#7394FF" />
      </linearGradient>
      <clipPath id="clip0_2020_324">
        <rect width="1440" height="300" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const WaveDark = (
  <svg
    className={styles.wave}
    width="100%"
    viewBox="0 0 1440 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clip-path="url(#clip0_2002_315)">
      <path
        d="M-240 344.114C-122.485 62.6994 333.195 289.04 550.509 138.352C876.604 -87.7728 995.042 196.141 1302.39 105.555C1492.76 49.4634 1495.7 -221.523 1680 -233V2027H-240L-240 344.114Z"
        fill="url(#paint0_linear_2002_315)"
      />
    </g>
    <defs>
      <linearGradient
        id="paint0_linear_2002_315"
        x1="1163.89"
        y1="-871.089"
        x2="399.648"
        y2="1621.13"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#313C9C" />
        <stop offset="1" stop-color="#313C9C" />
      </linearGradient>
      <clipPath id="clip0_2002_315">
        <rect width="1440" height="300" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const WaveLightMobile = (
  <svg
    className={styles.wave}
    width="100%"
    viewBox="0 0 390 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clip-path="url(#clip0_2020_322)">
      <path
        d="M0 30.9698C62.6134 -38.258 305.405 37.4218 421.193 0.352501C594.94 -55.2742 658.045 24.5685 821.805 2.2844C923.235 -11.5141 924.805 -38.1765 1023 -41V2419H0.00024002L0 30.9698Z"
        fill="url(#paint0_linear_2020_322)"
      />
    </g>
    <defs>
      <linearGradient
        id="paint0_linear_2020_322"
        x1="510.669"
        y1="-41"
        x2="514.68"
        y2="2284.07"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#7394FF" />
        <stop offset="1" stop-color="#7394FF" />
      </linearGradient>
      <clipPath id="clip0_2020_322">
        <rect width="390" height="150" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const WaveDarkMobile = (
  <svg
    className={styles.wave}
    width="100%"
    viewBox="0 0 390 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clip-path="url(#clip0_2001_312)">
      <path
        d="M0 30.9698C62.6134 -38.258 305.405 37.4218 421.193 0.352501C594.94 -55.2742 658.045 24.5685 821.805 2.2844C923.235 -11.5141 924.805 -38.1765 1023 -41V2419H0.00024002L0 30.9698Z"
        fill="url(#paint0_linear_2001_312)"
      />
    </g>
    <defs>
      <linearGradient
        id="paint0_linear_2001_312"
        x1="748.012"
        y1="-735.557"
        x2="667.114"
        y2="1922.28"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#313C9C" />
        <stop offset="1" stop-color="#313C9C" />
      </linearGradient>
      <clipPath id="clip0_2001_312">
        <rect width="390" height="150" fill="white" />
      </clipPath>
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
