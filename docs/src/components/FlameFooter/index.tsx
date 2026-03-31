import React from 'react';
import styles from './styles.module.css';

const FlameFooter = () => {
  console.log('🔥 FlameFooter rendering with combined flames');

  return (
    <div className={styles.flameContainer}>
      {/* Layer 1: Volumetric Parallax Waves */}
      <svg
        viewBox="0 0 600 200"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.flameLayer1}
        preserveAspectRatio="none"
        style={{ '--anim-delay': '0s' } as React.CSSProperties}
      >
        <defs>
          <linearGradient id="grad-1" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#4a0000" />
            <stop offset="100%" stopColor="#880000" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="grad-2" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#990000" />
            <stop offset="100%" stopColor="#ff2a00" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="grad-3" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#cc2200" />
            <stop offset="100%" stopColor="#ff7700" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="grad-4" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ff5500" />
            <stop offset="100%" stopColor="#ffcc00" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="grad-5" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ffcc00" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="grad-flare" cx="50%" cy="80%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#ffaa00" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
          </radialGradient>
          <path
            id="wave-1"
            d="M 0 140 C 75 80, 225 200, 300 140 S 525 200, 600 140 V 200 H 0 Z"
          />
          <path
            id="wave-2"
            d="M 0 150 C 50 100, 150 200, 200 150 S 350 200, 400 150 S 550 200, 600 150 V 200 H 0 Z"
          />
          <path
            id="wave-3"
            d="M 0 165 C 75 225, 225 105, 300 165 S 525 105, 600 165 V 200 H 0 Z"
          />
          <path
            id="wave-4"
            d="M 0 160 C 40 100, 110 220, 150 160 S 260 220, 300 160 S 410 220, 450 160 S 560 220, 600 160 V 200 H 0 Z"
          />
          <path
            id="wave-5"
            d="M 0 175 C 50 245, 150 105, 200 175 S 350 105, 400 175 S 550 105, 600 175 V 200 H 0 Z"
          />
          <path
            id="flare-shape"
            d="M 0 0 C -15 -40, -25 -80, 0 -130 C 25 -80, 15 -40, 0 0 Z"
          />
        </defs>

        <rect
          x="0"
          y="150"
          width="600"
          height="50"
          fill="#cc0000"
          filter="blur(15px)"
          opacity="0.4"
        />

        <g
          className={styles.breathe}
          style={{ '--breathe-duration': '3.2s' } as React.CSSProperties}
        >
          <g
            className={styles.pan}
            style={{ '--pan-duration': '14s' } as React.CSSProperties}
          >
            <use href="#wave-1" x="0" fill="url(#grad-1)" />
            <use href="#wave-1" x="600" fill="url(#grad-1)" />
          </g>
        </g>

        <g
          className={`${styles.breathe} ${styles.blendLayer}`}
          style={{ '--breathe-duration': '4.1s' } as React.CSSProperties}
        >
          <g
            className={styles.pan}
            style={{ '--pan-duration': '11s' } as React.CSSProperties}
          >
            <use href="#wave-2" x="0" fill="url(#grad-2)" />
            <use href="#wave-2" x="600" fill="url(#grad-2)" />
          </g>
        </g>

        <g
          className={`${styles.breathe} ${styles.blendLayer}`}
          style={{ '--breathe-duration': '3.7s' } as React.CSSProperties}
        >
          <g
            className={styles.pan}
            style={{ '--pan-duration': '8s' } as React.CSSProperties}
          >
            <use href="#wave-3" x="0" fill="url(#grad-3)" />
            <use href="#wave-3" x="600" fill="url(#grad-3)" />
          </g>
        </g>

        <g className={styles.flareGroup}>
          <g transform="translate(120, 190)">
            <use
              href="#flare-shape"
              className={`${styles.flare} ${styles.f1}`}
              fill="url(#grad-flare)"
            />
          </g>
          <g transform="translate(280, 185) scale(0.8)">
            <use
              href="#flare-shape"
              className={`${styles.flare} ${styles.f2}`}
              fill="url(#grad-flare)"
            />
          </g>
          <g transform="translate(420, 195) scale(1.1) rotate(5)">
            <use
              href="#flare-shape"
              className={`${styles.flare} ${styles.f3}`}
              fill="url(#grad-flare)"
            />
          </g>
          <g transform="translate(540, 180) scale(0.9) rotate(-5)">
            <use
              href="#flare-shape"
              className={`${styles.flare} ${styles.f4}`}
              fill="url(#grad-flare)"
            />
          </g>
        </g>

        <circle
          className={`${styles.ember} ${styles.e1}`}
          cx="150"
          cy="170"
          r="2.5"
        />
        <circle
          className={`${styles.ember} ${styles.e2}`}
          cx="300"
          cy="180"
          r="1.5"
        />
        <circle
          className={`${styles.ember} ${styles.e3}`}
          cx="480"
          cy="165"
          r="3"
        />

        <g
          className={`${styles.breathe} ${styles.blendLayer}`}
          style={{ '--breathe-duration': '2.8s' } as React.CSSProperties}
        >
          <g
            className={styles.pan}
            style={{ '--pan-duration': '6s' } as React.CSSProperties}
          >
            <use href="#wave-4" x="0" fill="url(#grad-4)" />
            <use href="#wave-4" x="600" fill="url(#grad-4)" />
          </g>
        </g>

        <g
          className={styles.breathe}
          style={{ '--breathe-duration': '2.3s' } as React.CSSProperties}
        >
          <g
            className={styles.pan}
            style={{ '--pan-duration': '4.5s' } as React.CSSProperties}
          >
            <use href="#wave-5" x="0" fill="url(#grad-5)" />
            <use href="#wave-5" x="600" fill="url(#grad-5)" />
          </g>
        </g>
      </svg>

      {/* Layer 2: Continuous Panning Fire */}
      <svg
        viewBox="0 0 400 200"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.flameLayer2}
        preserveAspectRatio="none"
        style={{ '--anim-delay': '1s' } as React.CSSProperties}
      >
        <defs>
          <linearGradient id="fire-back" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#1a0000" />
            <stop offset="60%" stopColor="#660000" />
            <stop offset="100%" stopColor="#cc0000" />
          </linearGradient>
          <linearGradient id="fire-mid" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#990000" />
            <stop offset="50%" stopColor="#ee3300" />
            <stop offset="100%" stopColor="#ff7700" />
          </linearGradient>
          <linearGradient id="fire-front" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#cc2200" />
            <stop offset="50%" stopColor="#ff6600" />
            <stop offset="100%" stopColor="#ffcc00" />
          </linearGradient>
          <linearGradient id="fire-burst" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ff6600" />
            <stop offset="70%" stopColor="#ffcc00" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <path
            id="path-back"
            d="M 0 180 Q 20 180 40 40 Q 55 190 90 120 Q 110 180 140 30 Q 160 190 190 130 Q 210 180 240 50 Q 260 190 290 110 Q 320 180 350 45 Q 370 190 400 180 L 400 200 L 0 200 Z"
          />
          <path
            id="path-mid"
            d="M 0 190 Q 15 190 30 90 Q 45 195 70 140 Q 90 190 120 70 Q 140 195 170 150 Q 190 190 220 80 Q 240 195 270 140 Q 290 190 320 85 Q 340 195 370 150 Q 385 190 400 190 L 400 200 L 0 200 Z"
          />
          <path
            id="path-front"
            d="M 0 200 Q 10 200 25 130 Q 40 200 60 160 Q 80 200 100 120 Q 120 200 140 170 Q 160 200 185 110 Q 205 200 230 160 Q 250 200 270 125 Q 290 200 310 165 Q 330 200 355 115 Q 375 200 400 200 Z"
          />
        </defs>

        <rect
          x="0"
          y="180"
          width="400"
          height="20"
          fill="#cc0000"
          filter="blur(8px)"
        />

        <g className={styles.panBack}>
          <use href="#path-back" x="0" fill="url(#fire-back)" />
          <use href="#path-back" x="400" fill="url(#fire-back)" />
        </g>

        <g className={styles.panMid}>
          <use href="#path-mid" x="0" fill="url(#fire-mid)" />
          <use href="#path-mid" x="400" fill="url(#fire-mid)" />
        </g>

        <g className={styles.burstLayer}>
          <path
            className={`${styles.burst} ${styles.b1}`}
            d="M 80 200 Q 100 150 110 40 Q 120 150 140 200 Z"
            fill="url(#fire-burst)"
          />
          <path
            className={`${styles.burst} ${styles.b2}`}
            d="M 230 200 Q 250 120 260 10 Q 270 120 290 200 Z"
            fill="url(#fire-burst)"
          />
          <path
            className={`${styles.burst} ${styles.b3}`}
            d="M 330 200 Q 345 140 355 60 Q 365 140 380 200 Z"
            fill="url(#fire-burst)"
          />
        </g>

        <g className={styles.panFront}>
          <use href="#path-front" x="0" fill="url(#fire-front)" />
          <use href="#path-front" x="400" fill="url(#fire-front)" />
        </g>

        <g className={styles.sparkLayer}>
          <circle
            className={`${styles.spark} ${styles.s1}`}
            cx="60"
            cy="170"
            r="2.5"
            fill="#ffea00"
          />
          <circle
            className={`${styles.spark} ${styles.s2}`}
            cx="130"
            cy="180"
            r="1.5"
            fill="#ffea00"
          />
          <circle
            className={`${styles.spark} ${styles.s3}`}
            cx="210"
            cy="150"
            r="2.0"
            fill="#ffea00"
          />
          <circle
            className={`${styles.spark} ${styles.s4}`}
            cx="290"
            cy="160"
            r="1.5"
            fill="#ffea00"
          />
          <circle
            className={`${styles.spark} ${styles.s5}`}
            cx="370"
            cy="175"
            r="2.5"
            fill="#ffea00"
          />
        </g>
      </svg>

      {/* Layer 3: Individual Flames - densely packed, irregular formations */}
      {[
        { left: '5%', delay: 0, scale: 0.8 },
        { left: '12%', delay: 0.6, scale: 1.1 },
        { left: '8%', delay: 1.3, scale: 0.9 },
        { left: '22%', delay: 0.3, scale: 1.0 },
        { left: '28%', delay: 1.1, scale: 0.85 },
        { left: '35%', delay: 0.8, scale: 1.15 },
        { left: '32%', delay: 1.6, scale: 0.95 },
        { left: '45%', delay: 0.4, scale: 1.05 },
        { left: '51%', delay: 1.4, scale: 0.9 },
        { left: '48%', delay: 0.2, scale: 1.2 },
        { left: '62%', delay: 1.0, scale: 0.88 },
        { left: '68%', delay: 0.7, scale: 1.08 },
        { left: '65%', delay: 1.5, scale: 0.92 },
        { left: '78%', delay: 0.5, scale: 1.12 },
        { left: '82%', delay: 1.2, scale: 0.95 },
        { left: '88%', delay: 0.9, scale: 1.0 },
        { left: '85%', delay: 1.7, scale: 0.87 },
        { left: '93%', delay: 0.1, scale: 1.1 },
      ].map((flame, index) => (
        <svg
          key={index}
          viewBox="0 0 100 150"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.individualFlame}
          style={
            {
              '--flame-index': index,
              '--anim-delay': `${flame.delay}s`,
              'left': flame.left,
              'transform': `scale(${flame.scale})`,
            } as React.CSSProperties
          }
        >
          <defs>
            <linearGradient
              id={`gradOuter-${index}`}
              x1="0%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#4a0000" />
              <stop offset="40%" stopColor="#cc0000" />
              <stop offset="100%" stopColor="#ff3d00" />
            </linearGradient>
            <linearGradient
              id={`gradMid-${index}`}
              x1="0%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#e65100" />
              <stop offset="50%" stopColor="#ff9800" />
              <stop offset="100%" stopColor="#ffea00" />
            </linearGradient>
            <linearGradient
              id={`gradCore-${index}`}
              x1="0%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#ffca28" />
              <stop offset="60%" stopColor="#ffff00" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <filter
              id={`glow-${index}`}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <ellipse
            cx="50"
            cy="130"
            rx="25"
            ry="5"
            fill="#ff3d00"
            filter="blur(4px)"
            opacity="0.5"
          />

          <g className={styles.flameContainer2}>
            <path
              className={styles.burstFlare}
              d="M 50 130 C 10 130 0 90 20 70 C 10 50 30 30 50 10 C 70 30 90 50 80 70 C 100 90 90 130 50 130 Z"
              fill={`url(#gradOuter-${index})`}
            />

            <path
              className={styles.flameOuter}
              d="M 50 130 C 20 130 20 100 30 90 C 25 75 40 50 50 20 C 60 50 75 75 70 90 C 80 100 80 130 50 130 Z"
              fill={`url(#gradOuter-${index})`}
              filter={`url(#glow-${index})`}
            />
            <path
              className={styles.flameMid}
              d="M 50 125 C 30 125 30 105 38 95 C 34 85 45 65 50 40 C 55 65 66 85 62 95 C 70 105 70 125 50 125 Z"
              fill={`url(#gradMid-${index})`}
            />
            <path
              className={styles.flameCore}
              d="M 50 120 C 40 120 40 110 44 105 C 42 100 48 85 50 70 C 52 85 58 100 56 105 C 60 110 60 120 50 120 Z"
              fill={`url(#gradCore-${index})`}
            />
          </g>

          <circle
            className={`${styles.indivSpark} ${styles.sp1}`}
            cx="50"
            cy="115"
            r="2.5"
            fill="#ffeb3b"
            style={{ '--dx': '-25px', '--dy': '-80px' } as React.CSSProperties}
          />
          <circle
            className={`${styles.indivSpark} ${styles.sp2}`}
            cx="45"
            cy="110"
            r="1.5"
            fill="#ffffff"
            style={{ '--dx': '15px', '--dy': '-90px' } as React.CSSProperties}
          />
          <circle
            className={`${styles.indivSpark} ${styles.sp3}`}
            cx="55"
            cy="105"
            r="3.0"
            fill="#ff9800"
            style={{ '--dx': '-10px', '--dy': '-70px' } as React.CSSProperties}
          />
          <circle
            className={`${styles.indivSpark} ${styles.sp4}`}
            cx="52"
            cy="100"
            r="2.0"
            fill="#ffea00"
            style={{ '--dx': '30px', '--dy': '-100px' } as React.CSSProperties}
          />
          <circle
            className={`${styles.indivSpark} ${styles.sp5}`}
            cx="48"
            cy="95"
            r="1.2"
            fill="#ffffff"
            style={{ '--dx': '-5px', '--dy': '-110px' } as React.CSSProperties}
          />
        </svg>
      ))}
    </div>
  );
};

export default FlameFooter;
