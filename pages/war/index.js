import React, { useRef, useEffect, useState } from "react";
import Image from 'next/legacy/image';
import { getSession } from "next-auth/react";
import axios from "axios";
import calculatePoints from "../../utils/calculatePoints";
import { signOut, useSession } from 'next-auth/react';
import Header from 'C/header';

export default function War({ errorServer, war, player, totalPoints }) {
    const { data: session, status } = useSession();
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const [width, setWidth] = useState(0);
    const [points, setPoints] = React.useState(totalPoints || 0);
    const [availableDirections, setAvailableDirections] = useState({ up: true, down: true, left: true, right: true });
    const positionXValue = player.position_x;
    const positionYValue = player.position_y;
    // État pour contrôler l'ouverture du menu
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Gestionnaire d'événements pour le clic sur une tuile
    const handleClickTile = (position_x, position_y) => {
        // Logique pour déterminer les directions disponibles pour le déplacement du joueur
        const directions = {
            up: position_y > 1,
            down: position_y < 11,
            left: position_x < 1,
            right: position_x < 11
        };
        setAvailableDirections(directions);
    };

    // Fonction pour basculer l'état du menu
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

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
    // useEffect(() => {
    //     if (windowSize.width < 640) {
    //         setWidth(30);
    //     } else if (windowSize.width < 768 && windowSize.width >= 640) {
    //         setWidth(50);
    //     } else if (windowSize.width < 1024 && windowSize.width >= 768) {
    //         setWidth(60);
    //     } else if (windowSize.width >= 1024 && windowSize.width < 1280) {
    //         setWidth(80);
    //     } else if (windowSize.width >= 1280 && windowSize.width < 1536) {
    //         setWidth(100);
    //     } else {
    //         setWidth(120);
    //     }
    // }, [windowSize.width]);

    if (errorServer) {
        return <div>{errorServer}</div>;
    }

    // Filtrer les tuiles récupérées par le backend pour ne garder que celles qui sont reçues
    const receivedTilesMap = new Map(war.tiles.map(tile => [`${tile.position_x},${tile.position_y}`, tile]));

    // Créer une liste de tuiles en incluant les tuiles vides
    const tilesWithEmpty = war.allCoordinates.map(({ position_x, position_y }) => {
        const key = `${position_x},${position_y}`;
        const matchingTile = war.tiles.find(tile => tile.position_x === position_x && tile.position_y === position_y);
        return matchingTile || { position_x, position_y, image_url: "", alt: "" };
    });

    // Trier les tuiles en fonction de leur position X et Y croissantes
    const sortedTiles = tilesWithEmpty.sort((a, b) => {
        if (a.position_x !== b.position_x) {
            return a.position_x - b.position_x;
        }
        return a.position_y - b.position_y;
    });

    if (session) {
        // return (
        //     <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
        //         <Header points={points} />
        //         <div className="flex justify-center items-center h-screen">
        //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        //                 {map.map((tile, index) => (
        //                     <div key={index} className="absolute cursor-pointer" style={{ left: `${tile.position_x * width - width}px`, top: `${tile.position_y * width - width}px` }}>
        //                         <Image
        //                             src={tile.image_url}
        //                             alt="Map"
        //                             height={width}
        //                             width={width}
        //                             objectFit="cover"
        //                             onClick={() => handleClickTile(tile.position_x, tile.position_y)}
        //                         />
        //                         {tile.position_x === player.position_x && tile.position_y === player.position_y && (
        //                             <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        //                                 <div className="" style={{ height: width * 90 / 100, width: width * 90 / 100 }}>
        //                                     <Image
        //                                         src={player.imageUrl}
        //                                         alt={player.name}
        //                                         className="rounded-full"
        //                                         layout="fill"

        //                                     />
        //                                 </div>
        //                             </div>
        //                         )}
        //                     </div>
        //                 ))}
        //             </div>

        //             {Object.entries(availableDirections).map(([direction, available]) => (
        //                 available && (
        //                     <div key={direction} className="absolute">
        //                         <button className="p-2 rounded bg-blue-500 text-white" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        //                             {direction.toUpperCase()}
        //                         </button>
        //                     </div>
        //                 )
        //             ))}

        //         </div>

        //         <nav class="menu">
        //             <input type="checkbox" href="#" class="menu-open" name="menu-open" id="menu-open" />
        //             <label class="menu-open-button" for="menu-open">
        //                 <span class="hamburger hamburger-1"></span>
        //                 <span class="hamburger hamburger-2"></span>
        //                 <span class="hamburger hamburger-3"></span>
        //             </label>

        //             <a href="#" class="menu-item"> <i class="fa fa-bar-chart"></i> </a>
        //             <a href="#" class="menu-item"> <i class="fa fa-plus"></i> </a>
        //             <a href="#" class="menu-item"> <i class="fa fa-heart"></i> </a>
        //             <a href="#" class="menu-item"> <i class="fa fa-envelope"></i> </a>
        //             <a href="#" class="menu-item"> <i class="fa fa-cog"></i> </a>
        //             <a href="#" class="menu-item"> <i class="fa fa-ellipsis-h"></i> </a>

        //         </nav>

        //         <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
        //             <defs>
        //                 <filter id="shadowed-goo">

        //                     <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
        //                     <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
        //                     <feGaussianBlur in="goo" stdDeviation="3" result="shadow" />
        //                     <feColorMatrix in="shadow" mode="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 -0.2" result="shadow" />
        //                     <feOffset in="shadow" dx="1" dy="1" result="shadow" />
        //                     <feComposite in2="shadow" in="goo" result="goo" />
        //                     <feComposite in2="goo" in="SourceGraphic" result="mix" />
        //                 </filter>
        //                 <filter id="goo">
        //                     <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
        //                     <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
        //                     <feComposite in2="goo" in="SourceGraphic" result="mix" />
        //                 </filter>
        //             </defs>
        //         </svg>
        //     </div>
        // );
        return (
            <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
                <Header points={points} />
                <div className="grid grid-cols-11 border-black">
                    {/* Afficher les tuiles autour du joueur dans l'ordre croissant de distance relative au joueur */}
                    {sortedTiles.map((tile, index) => (
                        <div key={index} className="relative cursor-pointer">
                            {/* Image de la tuile ou une div vide si la tuile est vide */}
                            {tile.image_url ? (
                                <Image
                                    src={tile.image_url}
                                    alt={tile.alt}
                                    width={200} // Définir une taille par défaut pour les images
                                    height={200}
                                    layout="responsive" // Assurer un layout responsive pour les images
                                />
                            ) : (
                                <div style={{ width: '100%', paddingBottom: '100%' }} />
                            )}
                            {/* Image du joueur */}
                            {tile.position_x === positionXValue && tile.position_y === positionYValue && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div style={{ width: '50px', height: '50px' }}>
                                        <Image
                                            src={player.imageUrl}
                                            alt={player.name}
                                            className="rounded-full"
                                            layout="fill"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <nav class="menu">
                        <input type="checkbox" href="#" class="menu-open" name="menu-open" id="menu-open" />
                        <label class="menu-open-button" for="menu-open">
                            <span class="hamburger hamburger-1"></span>
                            <span class="hamburger hamburger-2"></span>
                            <span class="hamburger hamburger-3"></span>
                        </label>

                        <a href="#" class="menu-item"> <i class="fa fa-bar-chart"></i> </a>
                        <a href="#" class="menu-item"> <i class="fa fa-plus"></i> </a>
                        <a href="#" class="menu-item"> <i class="fa fa-heart"></i> </a>
                        <a href="#" class="menu-item"> <i class="fa fa-envelope"></i> </a>
                        <a href="#" class="menu-item"> <i class="fa fa-cog"></i> </a>
                        <a href="#" class="menu-item"> <i class="fa fa-ellipsis-h"></i> </a>

                    </nav>

                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
                        <defs>
                            <filter id="shadowed-goo">

                                <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
                                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                                <feGaussianBlur in="goo" stdDeviation="3" result="shadow" />
                                <feColorMatrix in="shadow" mode="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 -0.2" result="shadow" />
                                <feOffset in="shadow" dx="1" dy="1" result="shadow" />
                                <feComposite in2="shadow" in="goo" result="goo" />
                                <feComposite in2="goo" in="SourceGraphic" result="mix" />
                            </filter>
                            <filter id="goo">
                                <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
                                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                                <feComposite in2="goo" in="SourceGraphic" result="mix" />
                            </filter>
                        </defs>
                    </svg>
                </div>
            </div>
        );
    }
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
        const war = await response.data;
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
            props: { war, totalPoints, player },
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