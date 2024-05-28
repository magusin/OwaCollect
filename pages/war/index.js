import React, { useRef, useEffect, useState } from "react";
import Image from 'next/legacy/image';
import { getSession } from "next-auth/react";
import axios from "axios";
import calculatePoints from "../../utils/calculatePoints";
import { signOut, useSession } from 'next-auth/react';
import Header from 'C/header';
import Head from 'next/head';
import Script from 'next/script'
import calculateDmg from "../../utils/calculateDmg";


export default function War({ errorServer, war, initialPlayer, totalPoints }) {
    const { data: session, status } = useSession();
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    // data game
    const [player, setPlayer] = useState(initialPlayer);
    const [coordinates, setCoordinates] = useState(war.allCoordinates);
    const [tiles, setTiles] = useState(war.tiles);
    // const [width, setWidth] = useState(0);
    const [points, setPoints] = React.useState(totalPoints || 0);
    const [availableDirections, setAvailableDirections] = useState({ up: true, down: true, left: true, right: true });
    const positionPlayer = player.map.id;
    const positionPlayerX = player.map.position_x;
    const positionPlayerY = player.map.position_y;
    const playerSkill = player.warPlayerSkills;
    // État pour contrôler l'ouverture du menu
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedTilePlayers, setSelectedTilePlayers] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMenuMoveOpen, setIsMenuMoveOpen] = useState(false);
    const [isModalSpell, setIsModalSpell] = useState(false);
    // Stocker les coordonnées de la tuile sélectionnée
    const [selectedTileX, setSelectedTileX] = useState(null);
    const [selectedTileY, setSelectedTileY] = useState(null);
    // Déclaration de l'état pour stocker les informations du joueur sélectionné
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    // loading state
    const [loading, setLoading] = useState(false);
    // state for active and passive skills
    const [activeOpen, setActiveOpen] = useState(false);
    const [passiveOpen, setPassiveOpen] = useState(false);
    // Tooltip state
    const [hoveredSkill, setHoveredSkill] = useState(null);
    // Fonction pour gérer le clic sur un joueur de la liste
    const handleClickPlayer = (player) => {
        // setSelectedTilePlayers(null)
        // Mettre à jour l'état avec les informations du joueur sélectionné
        setSelectedPlayer(player);
        // Ouvrir la modal
        setIsModalOpen(true);
    };

    const handleClickSpell = () => {
        setIsModalSpell(true);
    }


    const handleMouseEnter = (skill) => {
        setHoveredSkill(skill);
    };

    const handleMouseLeave = () => {
        setHoveredSkill(null);
    };

    console.log("playerSkill", playerSkill)

    // Gestionnaire d'événements pour le clic sur une tuile
    const handleClickTile = (tile) => {
        setIsModalOpen(false);
        // Filtrer les joueurs présents sur la tuile cliquée
        const playersOnTile = tile.warPlayers || [];
        setSelectedTilePlayers(playersOnTile);

        // Stocker les coordonnées de la tuile sélectionnée
        setSelectedTileX(tile.position_x);
        setSelectedTileY(tile.position_y);

        setIsModalOpen(true);
    };

    // Fonction pour fermer la fenêtre modale
    const closeModal = () => {
        // setIsModalOpen(false);
        setSelectedTilePlayers(null);
    };

    // Fonction pour fermer la fenêtre modale de joueur
    const closeModalPlayer = () => {
        // setIsModalOpen(false);
        setSelectedPlayer(null);
    };

    // Fonction pour fermer le menu de déplacement
    const closeMoveMenu = () => {
        setIsMenuMoveOpen(false);
    };

    // Fonction pour fermer la fenêtre modale de compétences
    const closeModalSpell = () => {
        setIsModalSpell(false);
    }

    // Gestionnaire d'événements pour le clic sur une tuile
    const handleClickMove = () => {
        // Logique pour déterminer les directions disponibles pour le déplacement du joueur
        const directions = {
            up: positionPlayerY > 1,
            down: positionPlayerY < 11,
            left: positionPlayerX > 1,
            right: positionPlayerX < 11
        };
        setAvailableDirections(directions);
        setIsMenuMoveOpen(true);
    };

    // Fonction pour basculer l'état du menu
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const movePlayer = async (direction) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/war/map/move`, {
                params: {
                    direction,
                },
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.customJwt}`,
                }
            });
            const updatedPlayer = await response.data;
            setPlayer(updatedPlayer.updatedUser);
            setTiles(updatedPlayer.tiles);
            setCoordinates(updatedPlayer.allCoordinates);
            setIsMenuMoveOpen(false);
            setIsMenuOpen(true);
            // setIsModalOpen(false);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function HeadView() {
        return (
            <Head>
                <title>War | Owarida</title>
                <meta name="description" content="Battez-vous sur le champ de bataille" />
                <meta name="keywords" content="Owarida, war, cartes, packs, points, elden ring" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
        )
    }

    if (errorServer) {
        return <div>{errorServer}</div>;
    }

    if (status === "loading" || loading) {
        return (
            <>
                <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
                    <Header points={points} />
                    <div className="flex-grow flex justify-center items-center">
                        <span className="text-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="#1f2937" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" /></path></svg></span>
                    </div>
                </div>
            </>
        )
    }

    // Filtrer les tuiles récupérées par le backend pour ne garder que celles qui sont reçues
    const receivedTilesMap = new Map(war.tiles.map(tile => [`${tile.position_x},${tile.position_y}`, tile]));

    // Créer une liste de tuiles en incluant les tuiles vides
    const tilesWithEmpty = coordinates.map(({ position_x, position_y }) => {
        const key = `${position_x},${position_y}`;
        const matchingTile = tiles.find(tile => tile.position_x === position_x && tile.position_y === position_y);
        return matchingTile || { position_x, position_y, image_url: "", alt: "" };
    });

    // Trier les tuiles en fonction de leur position X et Y croissantes
    const sortedTiles = tilesWithEmpty.sort((a, b) => {
        if (a.position_y !== b.position_y) {
            return a.position_y - b.position_y;
        }
        return a.position_x - b.position_x;
    });
    if (session) {
        return (
            <>
                <HeadView />
                <Script src="https://kit.fontawesome.com/261e37c4a6.js" crossorigin="anonymous"></Script>
                <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
                    <Header points={points} />
                    <div className="grid grid-cols-11">
                        {/* Afficher les tuiles autour du joueur dans l'ordre croissant de distance relative au joueur */}
                        {sortedTiles.map((tile, index) => (
                            <div key={index} className="relative cursor-pointer" onClick={() => handleClickTile(tile)}>
                                {/* Image de la tuile ou une div vide si la tuile est vide */}
                                {tile.image_url ? (
                                    <Image
                                        src={tile.image_url}
                                        alt={tile.alt}
                                        width={150} // Définir une taille par défaut pour les images
                                        height={150}
                                        layout="responsive" // Assurer un layout responsive pour les images
                                    />
                                ) : (
                                    <div style={{ width: '100%', paddingBottom: '100%' }} />
                                )}
                                {/* Image du joueur */}
                                {tile.id === positionPlayer ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div style={{ width: 'auto', height: 'auto', maxWidth: '80%', maxHeight: '80%' }}>
                                            <Image
                                                src={player.imageUrl}
                                                alt={player.name}
                                                className="rounded-full"
                                                layout="fill"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    tile.warPlayers && tile.warPlayers.length > 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div style={{ width: 'auto', height: 'auto', maxWidth: '80%', maxHeight: '80%' }}>
                                                <Image
                                                    src={tile.warPlayers[0].imageUrl}
                                                    alt={tile.warPlayers[0].name}
                                                    className="rounded-full"
                                                    layout="fill"
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        ))}
                    </div>

                    {isModalOpen && selectedTilePlayers && selectedPlayer === null && (
                        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 text-black z-10">
                            <div className="bg-white p-4 rounded-lg relative w-3/4 h-3/4 max-h-3/4 overflow-auto">
                                <h2 className="text-lg font-bold mb-4 text-center">X {selectedTileX}, Y {selectedTileY}</h2>
                                <h3 className="text-lg mb-2 text-center">{selectedTilePlayers.length > 0 ? "Joueur" : "Aucun joueur"}</h3>
                                <ul>
                                    {selectedTilePlayers.map((playerTile, index) => (

                                        <li key={index}
                                            className={`flex items-center ${playerTile.petId != player.petId ? "cursor-pointer" : ''}`}
                                            onClick={playerTile.petId !== player.petId ? () => handleClickPlayer(playerTile) : null}
                                        >
                                            {/* Image du joueur */}
                                            <img
                                                src={playerTile.imageUrl}
                                                alt={playerTile.name}
                                                className="w-8 h-8 rounded-full mr-2"

                                            />
                                            {/* Nom du joueur */}
                                            {playerTile.name}
                                        </li>
                                    ))}
                                </ul>
                                {/* Bouton pour fermer la fenêtre modale */}
                                <div className="flex justify-center absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                    <button onClick={closeModal} className="bg-red-500 text-white py-2 px-4 rounded">Fermer</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {isModalOpen && selectedPlayer && (
                        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 text-black z-10">
                            <div className="bg-white p-4 rounded-lg relative w-3/4 h-3/4 max-h-3/4 overflow-auto">
                                {/* Image du joueur */}
                                <img
                                    src={selectedPlayer.imageUrl}
                                    alt={selectedPlayer.name}
                                    className="lg:w-32 lg:h-32 md:w-24 md:h-24 h-16 w-16 rounded-full mx-auto mb-2"
                                />
                                {/* Nom du joueur */}
                                <h2 className="text-lg font-bold text-center mb-2">{selectedPlayer.name}</h2>
                                {/* Stats du joueur */}
                                {selectedPlayer.petId != player.petId ? (
                                    <p className="font-bold text-center mb-4">Level : {selectedPlayer.level}</p>

                                ) : (
                                    <>
                                        <p className="font-bold text-center mb-4">Level : {selectedPlayer.level}</p>
                                        <p className="font-bold text-center mb-4">HP : {selectedPlayer.hp}</p>

                                    </>
                                )}
                                <div className="flex justify-center absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                    <button className="bg-green-500 text-white py-2 px-4 rounded mr-4" onClick={null}>Attaquer</button>
                                    {/* Bouton pour fermer la fenêtre modale */}
                                    <button onClick={closeModalPlayer} className="bg-red-500 text-white py-2 px-4 rounded">Retour</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {isMenuMoveOpen && (
                        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 text-black z-10">
                            <div className="bg-white p-4 rounded-lg relative w-3/4 h-3/4 max-h-3/4 overflow-auto flex flex-col justify-between">
                                <h2 className="text-2xl font-bold mb-8 text-center">Déplacer le joueur</h2>
                                <div className="flex flex-col items-center space-y-4 mb-8">
                                    {availableDirections.up && (
                                        <button
                                            className="p-4 rounded-full bg-blue-500 text-white"
                                            onClick={() => movePlayer("up")}
                                        >
                                            <i className="fas fa-arrow-up text-4xl"></i>
                                        </button>
                                    )}
                                    <div className="flex space-x-4">
                                        {availableDirections.left && (
                                            <button
                                                className="p-4 rounded-full bg-blue-500 text-white"
                                                onClick={() => movePlayer("left")}
                                            >
                                                <i className="fas fa-arrow-left text-4xl"></i>
                                            </button>
                                        )}
                                        {availableDirections.right && (
                                            <button
                                                className="p-4 rounded-full bg-blue-500 text-white"
                                                onClick={() => movePlayer("right")}
                                            >
                                                <i className="fas fa-arrow-right text-4xl"></i>
                                            </button>
                                        )}
                                    </div>
                                    {availableDirections.down && (
                                        <button
                                            className="p-4 rounded-full bg-blue-500 text-white"
                                            onClick={() => movePlayer("down")}
                                        >
                                            <i className="fas fa-arrow-down text-4xl"></i>
                                        </button>
                                    )}
                                </div>
                                {/* Bouton pour fermer le menu */}
                                <div className="relative w-full mt-4">
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                                        <button onClick={closeMoveMenu} className="bg-red-500 text-white py-2 px-4 rounded text-xl">Fermer</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            {isModalSpell && (
                <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 text-black z-10">
                    <div className="bg-white p-4 rounded-lg relative w-3/4 h-3/4 max-h-3/4 overflow-auto flex flex-col justify-between">
                        <h2 className="text-2xl font-bold mb-8 text-center">Compétences</h2>
                        <div className="flex flex-col items-center space-y-4 mb-8 w-full">
                            {/* Liste des sorts actifs */}
                            <div className="w-full">
                                <button
                                    className="w-full bg-blue-500 text-white py-2 px-4 rounded text-xl mb-2"
                                    onClick={() => setActiveOpen(!activeOpen)}
                                >
                                    {activeOpen ? 'Cacher' : 'Afficher'} les sorts actifs
                                </button>
                                {activeOpen && (
                                    <ul className="flex flex-col md:flex-row md:flex-wrap">
                                    {playerSkill
                                        .filter(skill => skill.warSkills.type === 'actif')
                                        .map((skill, index) => (
                                            <li
                                                key={index}
                                                className="mt-2 group relative cursor-pointer md:w-1/2 lg:w-1/3 xl:w-1/4 p-2"
                                                onMouseEnter={() => handleMouseEnter(skill)}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                <div className="flex items-center">
                                                    <div className="relative w-6 h-6 mr-2">
                                                        <Image 
                                                            src={skill.warSkills.img} 
                                                            alt={`${skill.warSkills.name} icon`} 
                                                            layout="fill"
                                                            objectFit="contain"
                                                        />
                                                    </div>
                                                    <span className="font-bold">{skill.warSkills.name}</span>: ({skill.warSkills.cost} PA) 
                                                    <span className="text-red-800 ml-1">
                                                        {calculateDmg(player, skill.warSkills.stat, skill.warSkills.dmgMin, skill.warSkills.divider)} - 
                                                        {calculateDmg(player, skill.warSkills.stat, skill.warSkills.dmgMax, skill.warSkills.divider)}
                                                    </span>
                                                </div>
                                                {hoveredSkill === skill && (
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-700 text-white text-xs rounded w-max max-w-xs md:max-w-md lg:max-w-lg">
                                                        {skill.warSkills.description}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                </ul>
                                )}
                            </div>

                            {/* Liste des sorts passifs */}
                            <div className="w-full">
                                <button
                                    className="w-full bg-green-500 text-white py-2 px-4 rounded text-xl mb-2"
                                    onClick={() => setPassiveOpen(!passiveOpen)}
                                >
                                    {passiveOpen ? 'Cacher' : 'Afficher'} les sorts passifs
                                </button>
                                {passiveOpen && (
                                    <ul className="list-disc list-inside w-full">
                                        {playerSkill
                                            .filter(skill => skill.warSkills.type === 'passif')
                                            .map((skill, index) => (
                                                <li 
                                                    key={index} 
                                                    className="mt-2 group relative cursor-pointer"
                                                    onMouseEnter={() => handleMouseEnter(skill)}
                                                    onMouseLeave={handleMouseLeave}
                                                >
                                                    <span className="font-bold">{skill.warSkills.name}</span>: ({skill.warSkills.cost} PA) <span className="text-red-800">{calculateDmg(player, skill.warSkills.stat, skill.warSkills.dmgMin, skill.warSkills.divider)} - {calculateDmg(player, skill.warSkills.stat, skill.warSkills.dmgMax, skill.warSkills.divider)}</span>
                                                    {hoveredSkill === skill && (
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-700 text-white text-xs rounded w-max max-w-xs md:max-w-md lg:max-w-lg">
                                                            {skill.warSkills.description}
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        {/* Bouton pour fermer le menu */}
                        <div className="relative w-full mt-4">
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                                <button onClick={closeModalSpell} className="bg-red-500 text-white py-2 px-4 rounded text-xl">Fermer</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
                    <nav className="menu flex justify-center">
                        <input type="checkbox" href="#" className="menu-open" name="menu-open" onChange={toggleMenu} id="menu-open" checked={isMenuOpen} />
                        <label className="menu-open-button" htmlFor="menu-open" >
                            <span className="hamburger hamburger-1"></span>
                            <span className="hamburger hamburger-2"></span>
                            <span className="hamburger hamburger-3"></span>
                        </label>

                        <button className="menu-item flex items-center justify-center"> <img src="images/inventory.webp" className="rounded-full h-5/6" alt="Icon 1" /> </button>
                        <button className="menu-item flex items-center justify-center"> <img src="images/run.webp" className="rounded-full h-5/6" alt="Icon 2" onClick={() => handleClickMove()} /> </button>
                        <button className="menu-item flex items-center justify-center"> <img src="images/inventory.webp" className="rounded-full h-5/6" alt="Icon 3" /> </button>
                        <button className="menu-item flex items-center justify-center"> <img src="images/player.webp" className="rounded-full h-5/6" alt="Icon 4" onClick={() => handleClickPlayer(player)} /> </button>
                        <button className="menu-item flex items-center justify-center"> <img src="images/spell.webp" className="rounded-full h-5/6" alt="Icon 5" onClick={() => handleClickSpell()} /> </button>
                        <button className="menu-item flex items-center justify-center"> </button>

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
            </>
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
        const initialPlayer = await responseWar.data;

        const response = await axios.get(`${process.env.NEXTAUTH_URL}/api/war/map`, {
            params: {
                limit: 5,
                mapId: initialPlayer.mapId,
            },
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.customJwt}`,
                cookie: context.req.headers.cookie
            }
        })
        const war = await response.data;
        console.log("war", war)
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
            props: { war, totalPoints, initialPlayer },
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