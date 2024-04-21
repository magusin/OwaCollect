import React, { useRef, useEffect, useState } from "react";
import Image from 'next/legacy/image';
import { getSession } from "next-auth/react";
import axios from "axios";
import calculatePoints from "../../utils/calculatePoints";
import { signOut, useSession } from 'next-auth/react';
import Header from 'C/header';

export default function War({ errorServer, map, player, totalPoints }) {
    const { data: session, status } = useSession();
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const [width, setWidth] = useState(0);
    const [points, setPoints] = React.useState(totalPoints || 0);
    console.log('map', map)
    console.log('player', player)
    
    console.log(windowSize.width)

    useEffect(() => {
        function handleResize() {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        }

        window.addEventListener('resize', handleResize);

        // Au montage du composant, on récupère la taille de la fenêtre
        handleResize();

        // Nettoyage de l'écouteur d'événement au démontage du composant
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Utiliser useEffect pour mettre à jour la largeur de la tuile lorsque la taille de la fenêtre change
    useEffect(() => {
        if (windowSize.width < 640) {
            setWidth(50);
        } else if (windowSize.width < 1024) {
            setWidth(80);
        } else {
            setWidth(100);
        }
    }, [windowSize.width]);

    if (errorServer) {
        return <div>{errorServer}</div>;
    }

    if (session) {
        return (
            <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
                <Header points={points} />
            <div className="w-screen h-screen flex justify-center items-center">
                <div className="relative w-screen h-screen">
                    {map.map((tile) => {
                        const left = tile.position_x * width - width;  
                        const top = tile.position_y * width - width;  
    
                        return (
                            <div key={tile.id} className="absolute" style={{ left: `${left}px`, top: `${top}px` }}>
                                <Image
                                    src={tile.image_url}
                                    alt="Map"
                                    height={width}
                                    width={width} 
                                />
                                {tile.position_x === player.position_x && tile.position_y === player.position_y && (
                                    <div key={player.petId} className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                        <Image
                                            src={player.imageUrl}
                                            alt={player.name}
                                            className="rounded-full" 
                                            height={100}
                                            width={100} 
                                            
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
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
                limit: 5,
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