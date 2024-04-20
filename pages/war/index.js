import React, { useRef, useEffect, useState } from "react";
import Image from 'next/legacy/image';

export default function War({  }) {

    const playerPosition = { x: 10, y: 10 }; // Position du joueur sur la carte
    const mapWidth = 10944; // Largeur totale de la carte
    const mapHeight = 10944; // Hauteur totale de la carte
    const tileSize = 40; // Taille d'une case sur la carte
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setContainerSize({ width, height });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const viewWidth = containerSize.width;
    const viewHeight = containerSize.height;

    // Calcul des coordonnées de l'image pour centrer la vue autour du joueur
    const imageX = Math.max(0, Math.min(playerPosition.x * tileSize - viewWidth / 2, mapWidth - viewWidth));
    const imageY = Math.max(0, Math.min(playerPosition.y * tileSize - viewHeight / 2, mapHeight - viewHeight));

    return (
        <div ref={containerRef} style={{ width: '100vh', height: '50vh', overflow: 'hidden', position: 'relative', border: '1px solid black' }}>
            <div style={{ position: 'absolute', left: -imageX, top: -imageY }}>
                <Image
                    src="/images/testMap-min.jpg"
                    alt="Map"
                    width={mapWidth * tileSize}
                    height={mapHeight * tileSize}
                />
            </div>
        </div>
    );
}