'use client';

import { useEffect, useRef } from 'react';

export default function GoldParticles( {isFull} ) {
  const containerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const container = containerRef.current;
      if (!container) return;

      const sparkle = document.createElement('div');
      sparkle.className = isFull ? 'sparkle-full' : 'sparkle';

      sparkle.style.left = isFull ? `${Math.random() * 90}%` : `${Math.random() * 100}%`;
      sparkle.style.top = isFull ? `${Math.random() * 90}%` : `${Math.random() * 100}%`;
      sparkle.style.animationDuration = `${1 + Math.random()}s`;
      sparkle.style.width = isFull ? `${6 + Math.random() * 6}px` : `${3 + Math.random() * 3}px`;
      sparkle.style.height = sparkle.style.width;

      container.appendChild(sparkle);

      setTimeout(() => {
        sparkle.remove();
      }, 1800);
    }, 160);

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none overflow-hidden" />
  );
}