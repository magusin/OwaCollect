'use client';

import { useEffect, useRef } from 'react';

export default function GoldParticles() {
  const containerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const container = containerRef.current;
      if (!container) return;

      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';

      sparkle.style.left = `${Math.random() * 100}%`;
      sparkle.style.top = `${Math.random() * 100}%`;
      sparkle.style.animationDuration = `${1 + Math.random()}s`;
      sparkle.style.width = `${3 + Math.random() * 3}px`;
      sparkle.style.height = sparkle.style.width;

      container.appendChild(sparkle);

      setTimeout(() => {
        sparkle.remove();
      }, 1800);
    }, 360);

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none overflow-hidden" />
  );
}