import React, { useRef, useEffect, useState } from 'react';
import useScreenSize from '@site/src/hooks/useScreenSize';
import useBaseUrl from '@docusaurus/useBaseUrl';

const Logo = () => {
  const { windowWidth } = useScreenSize();
  const gifUrl = useBaseUrl('/img/logo-hero-flame.gif');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCanvas, setShowCanvas] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = gifUrl;

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Calculate GIF duration (approximate based on typical frame rates)
      // Adjust this timeout to match your GIF's actual duration
      const gifDuration = 7500; // milliseconds - adjust as needed!

      setTimeout(() => {
        // Draw the final frame
        ctx.drawImage(img, 0, 0);
        setShowCanvas(true);
      }, gifDuration);
    };
  }, [gifUrl]);

  if (windowWidth <= 768) {
    return null;
  }

  return (
    <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
      <img
        src={gifUrl}
        alt="React Native ExecuTorch 🔥💀"
        style={{
          maxWidth: '400px',
          width: '100%',
          display: showCanvas ? 'none' : 'block',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '400px',
          width: '100%',
          display: showCanvas ? 'block' : 'none',
        }}
      />
    </div>
  );
};

export default Logo;
