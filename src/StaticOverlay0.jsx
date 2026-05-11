import React, { useEffect, useRef, useState } from 'react';

// ============================================================================
// Auto-generated Standalone TV Static Overlay Component
// Usage: <StaticOverlay isActive={true} duration={3000} onComplete={() => console.log('Done')} />
// ============================================================================

export default function StaticOverlay({ isActive = false, duration = 3000, onComplete }) {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const lastFrameTimeRef = useRef(0);
  const previousFrameDataRef = useRef(null);
  const [isVisible, setIsVisible] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          if (onComplete) onComplete();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [isActive, duration, onComplete]);

  const renderStatic = (timestamp) => {
    if (!isVisible) {
      requestRef.current = requestAnimationFrame(renderStatic);
      return;
    }

    const fps = 30;
    const grainSize = 2;
    const frameInterval = 1000 / fps;

    if (timestamp - lastFrameTimeRef.current >= frameInterval) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { alpha: true });
      const w = Math.floor(canvas.offsetWidth / grainSize);
      const h = Math.floor(canvas.offsetHeight / grainSize);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        previousFrameDataRef.current = null;
      }

      const imgData = ctx.createImageData(w, h);
      const data = imgData.data;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          let r, g, b;

          
          const shade = Math.random() * 255; r = shade; g = shade; b = shade;
          

          
          const scrollSpeed = timestamp * 0.02;
          const bandIntensity = Math.sin((y + scrollSpeed) * 0.15);
          const multiplier = 0.6 + (bandIntensity * 0.4);
          r *= multiplier; g *= multiplier; b *= multiplier;
          

          

          

          data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      
      lastFrameTimeRef.current = timestamp;
    }
    requestRef.current = requestAnimationFrame(renderStatic);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(renderStatic);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
          .crt-overlay-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.5; image-rendering: pixelated; }
          
          .vhs-scanlines {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0;
            background: repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.8) 2px, rgba(0,0,0,0.8) 4px);
          }
          .vhs-noise {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 1; mix-blend-mode: overlay;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          }
          
          
          .overlay-text { position: absolute; margin: 0; font-family: 'VT323', monospace; color: #00ff14; text-shadow: 0px 0px 1px #00ff14, 1.3px 1.3px 1px rgba(17, 255, 0, 0.7), -1.3px -1.3px 1px rgba(17, 255, 0, 0.7), 0.125px 0px 0.0625px rgba(0, 255, 17, 0.875), 0.25px 0px 0.125px rgba(0, 255, 17, 0.75), 0.375px 0px 0.1875px rgba(0, 255, 17, 0.625), 0.5px 0px 0.25px rgba(0, 255, 17, 0.5), 0.625px 0px 0.3125px rgba(0, 255, 17, 0.375), 0.75px 0px 0.375px rgba(0, 255, 17, 0.25), 0.875px 0px 0.4375px rgba(0, 255, 17, 0.125), 1px 0px 0.5px rgba(0, 255, 17, 0); line-height: 1; }
          
          
          @keyframes text-jitter { 0%, 9%, 11%, 100% { transform: translateX(0) skewX(0); } 10% { transform: translateX(-8px) skewX(8deg); } 10.5% { transform: translateX(8px) skewX(-8deg); } }
          
          
        `}
      </style>
      
      <canvas ref={canvasRef} className="crt-overlay-canvas"></canvas>
      <div className="vhs-scanlines"></div><div className="vhs-noise"></div>
      
      
      <div className="" style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>
        <p className="overlay-text" style={{ 
            fontSize: 'clamp(40px, 15vw, 150px)', 
            left: '7%', top: '79%', 
            transform: 'translate(-7%, -79%)', 
            animation: 'text-jitter 1.5s infinite linear', 
        }}>PORTFOLIO</p>
        <p className="overlay-text" style={{ 
            fontSize: 'clamp(40px, 15vw, 150px)', 
            left: '87%', top: '6%', 
            transform: 'translate(-87%, -6%)', 
            animation: 'text-jitter 1.5s infinite linear', 
        }}>8</p>
      </div>
    </div>
  );
}
