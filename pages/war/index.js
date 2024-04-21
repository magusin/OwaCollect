import React, { useRef, useEffect, useState } from "react";
import Image from 'next/legacy/image';
import { getSession } from "next-auth/react";
import axios from "axios";
import calculatePoints from "../../utils/calculatePoints";
import { signOut, useSession } from 'next-auth/react';

export default function War({ errorServer, map, player }) {
    const { data: session, status } = useSession();
    console.log('map', map)
    console.log('player', player)

    if (errorServer) {
        return <div>{errorServer}</div>;
    }

    if (session) {
        return (
            <div style={{ width: '100%', height: '100vh', overflow: 'auto', position: 'relative' }}>
                {map.map((tile) => {
                const left = tile.position_x * 140;  // Position horizontale basée sur la position X de la tuile
                const top = tile.position_y * 140;  // Position verticale basée sur la position Y de la tuile

                return (
                    <div key={tile.id} style={{ position: 'absolute', left: `${left}px`, top: `${top}px` }}>
                        <Image
                            src={tile.image_url}
                            alt="Map"
                            width={140}
                            height={140}
                        />
                        {tile.position_x === player.position_x && tile.position_y === player.position_y && (
                            <div key={player.petId} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                                <Image
                                    src={player.imageUrl}
                                    alt={player.name}
                                    width={500}
                                    height={500}
                                    zIndex={100}
                                    style={{ borderRadius: '50%' }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
            </div>
        );
    }

    //     const playerPosition = { x: 10, y: 10 }; // Position du joueur sur la carte
    //     const mapWidth = 10944; // Largeur totale de la carte
    //     const mapHeight = 10944; // Hauteur totale de la carte
    //     const tileSize = 40; // Taille d'une case sur la carte
    //     const containerRef = useRef(null);
    //     const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    //     useEffect(() => {
    //         const handleResize = () => {
    //             if (containerRef.current) {
    //                 const { width, height } = containerRef.current.getBoundingClientRect();
    //                 setContainerSize({ width, height });
    //             }
    //         };

    //         handleResize();
    //         window.addEventListener('resize', handleResize);

    //         return () => {
    //             window.removeEventListener('resize', handleResize);
    //         };
    //     }, []);

    //     const viewWidth = containerSize.width;
    //     const viewHeight = containerSize.height;

    //     // Calcul des coordonnées de l'image pour centrer la vue autour du joueur
    //     const imageX = Math.max(0, Math.min(playerPosition.x * tileSize - viewWidth / 2, mapWidth - viewWidth));
    //     const imageY = Math.max(0, Math.min(playerPosition.y * tileSize - viewHeight / 2, mapHeight - viewHeight));

    //     return (
    //         <div ref={containerRef} style={{ width: '100vh', height: '50vh', overflow: 'hidden', position: 'relative', border: '1px solid black' }}>
    //             <div style={{ position: 'absolute', left: -imageX, top: -imageY }}>
    //                 <Image
    //                     src="/images/testMap-min.jpg"
    //                     alt="Map"
    //                     width={mapWidth * tileSize}
    //                     height={mapHeight * tileSize}
    //                 />
    //             </div>
    //         </div>
    //     );
}

export async function getServerSideProps(context) {
    const session = await getSession(
        context
    );

    if (!session) {
        return {
            props: { errorServer: 'Session expirée reconnectez-vous' },
        };
    }

    try {
        const responseWar = await axios.get(`${process.env.NEXTAUTH_URL}/api/war/player`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.customJwt}`,
                cookie: context.req.headers.cookie
            }
        });
        const player = await responseWar.data;


        const response = await axios.get(`${process.env.NEXTAUTH_URL}/api/war/map`, {
            params: {
                limit: 2,
                positionX: player.position_x,
                positionY: player.position_y
            },
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.customJwt}`,
                cookie: context.req.headers.cookie
            }
        })
        const map = await response.data;
        console.log(map)
        const timestamp = new Date().getTime().toString();
        const signature = await axios.post(`${process.env.NEXTAUTH_URL}/api/generateSignature`, {
            timestamp: timestamp
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.customJwt}`,
                cookie: context.req.headers.cookie
            }
        });
        const responseUser = await axios.get(`${process.env.NEXTAUTH_URL}/api/user`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.customJwt}`,
                cookie: context.req.headers.cookie,
                'x-timestamp': timestamp,
                'x-signature': signature.data.signature
            }
        })
        const user = await responseUser.data;
        const totalPoints = calculatePoints(user);
        return {
            props: { map, totalPoints, player },
        };
    } catch (error) {
        if (error.response?.status === 401) {
            return {
                props: { errorServer: 'Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.' },
            };
        }

        return {
            props: { errorServer: error.message },
        };
    }
}