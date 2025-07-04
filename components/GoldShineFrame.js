'use client';

import { useEffect, useRef } from 'react';

export default function GoldShineFrame({ category, rarety }) {
  const containerRef = useRef(null);

  function getSparklePositions(category, rarety) {
    let positions = [];

    switch (category) {
      case 'Elden Ring':
        switch (rarety) {
          case 'Commune':
            positions = [
              { top: '9.5%', right: '9%' },
              { bottom: '9.5%', left: '8%' },
              { top: '47%', right: '7%' },
              { top: '47%', left: '6%' },
              { bottom: '12%', right: '48%' },
              
            ];
            break;
          case 'Rare':
            positions = [
              { bottom: '18%', left: '47%' },
              { top: '47%', right: '13%' },
              { top: '47%', left: '13%' },
              { bottom: '9%', left: '6%' },
              { top: '9%', right: '6%' }
              
            ];
            break;
            // A finir
          case 'Epique':
            positions = [
              { top: '15%', left: '15%' },
              { top: '40%', right: '20%' },
              { bottom: '20%', left: '25%' },
              { bottom: '5%', right: '10%' },
            ];
            break;
          default:
            break;
        }
        break;

      case 'Dark Souls':
        switch (rarety) {
          case 'Commune':
            positions = [
              { top: '20%', left: '20%' },
              { bottom: '20%', right: '20%' },
            ];
            break;
          case 'Rare':
            positions = [
              { top: '10%', right: '30%' },
              { bottom: '30%', left: '10%' },
              { top: '60%', left: '40%' },
            ];
            break;
          case 'Epique':
            positions = [
              { top: '10%', left: '10%' },
              { top: '50%', right: '25%' },
              { bottom: '10%', left: '40%' },
              { bottom: '30%', right: '15%' },
            ];
            break;
          default:
            break;
        }
        break;

      default:
        positions = [{ top: '50%', left: '50%' }];
        break;
    }

    return positions;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const container = containerRef.current;
      if (!container) return;

      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle-frame';

      const positions = getSparklePositions(category, rarety);

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
