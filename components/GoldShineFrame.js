'use client';

import { useEffect, useRef } from 'react';

export default function GoldShineFrame() {
  const containerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const container = containerRef.current;
      if (!container) return;

      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle-frame';

      // Position stratégique : bords/corners uniquement
      const positions = [
        { top: '10%', left: '10%' },
        { top: '10%', right: '10%' },
        { bottom: '10%', left: '10%' },
        { bottom: '10%', right: '10%' },
        { top: '50%', left: '5%' },
        { top: '5%', left: '50%' },
        { top: '50%', right: '5%' },
        { bottom: '5%', left: '50%' }
      ];

      const pos = positions[Math.floor(Math.random() * positions.length)];
      Object.assign(sparkle.style, pos);

      container.appendChild(sparkle);

      setTimeout(() => {
        sparkle.remove();
      }, 1000);
    }, 3000); // une étincelle toutes les ~600ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none overflow-hidden" />
  );
}
