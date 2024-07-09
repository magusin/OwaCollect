import React, { useRef, useEffect, useState } from "react";
import Image from 'next/legacy/image';
import { getSession } from "next-auth/react";
import axios from "axios";
import calculatePoints from "../../utils/calculatePoints";
import { signOut, useSession } from 'next-auth/react';
import Header from 'C/header';
import Alert from "C/alert";
import Head from 'next/head';
import Script from 'next/script';
import calculateDmg from "../../utils/calculateDmg";
import calculateDef from "../../utils/calculateDef";
import calculatePassiveSpellsStats from "../../utils/calculatePassiveSpellsStats";
import xpToNextLevel from "../../utils/xpToNextLevel";
import { useRouter } from "next/router";

export default function War({ errorServer, war, initialPlayer, totalPoints }) {
    const [error, setError] = React.useState(errorServer || null);
    const { data: session, status } = useSession();
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    // const [width, setWidth] = useState(0);
    const [points, setPoints] = useState(totalPoints || 0);
    const [availableDirections, setAvailableDirections] = useState({ up: true, down: true, left: true, right: true });
    // État pour contrôler l'ouverture des menus
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedTilePlayers, setSelectedTilePlayers] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMenuMoveOpen, setIsMenuMoveOpen] = useState(false);
    const [isModalSpell, setIsModalSpell] = useState(false);
    const [isModalFight, setIsModalFight] = useState(false);
    const [isModalMessage, setIsModalMessage] = useState(false);
    const [isModalItems, setIsModalItems] = useState(false);
    // Déclaration de l'état pour stocker l'item sélectionné   
    const [selectedItem, setSelectedItem] = useState(null);
    console.log('selectedItem', selectedItem);
    // Stocker les coordonnées de la tuile sélectionnée
    const [selectedTileX, setSelectedTileX] = useState(null);
    const [selectedTileY, setSelectedTileY] = useState(null);
    // Déclaration de l'état pour stocker les informations du joueur sélectionné
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    // Déclaration de l'état pour stocker les informations du monstre sélectionné
    const [selectedMonster, setSelectedMonster] = useState(null);
    // Déclaration de l'état pour stocker les monstres de la tuile sélectionnée
    const [selectedTileMonsters, setSelectedTileMonsters] = useState(null);
    // loading state
    const [loading, setLoading] = useState(false);
    // state for active and passive skills
    const [activeOpen, setActiveOpen] = useState(false);
    const [passiveOpen, setPassiveOpen] = useState(false);
    // Tooltip state
    const [hoveredSkill, setHoveredSkill] = useState(null);
    const [hoveredItem, setHoveredItem] = useState(null);
    // Déclaration de l'état du spell sélectionné pour l'attaque
    const [selectedFightSpell, setSelectedFightSpell] = useState(null);
    // Stocker les skills sélectionnés
    const [selectedPassiveSkills, setSelectedPassiveSkills] = useState([]);
    // Alert
    const [alertMessage, setAlertMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertType, setAlertType] = useState(null);
    // Router
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);

    const passiveSpellsStats = calculatePassiveSpellsStats(selectedPassiveSkills);

    useEffect(() => {

        localStorage.setItem('points', points);

        if (error === 'Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.') {
            setTimeout(() => {
                localStorage.removeItem('userOC');
                localStorage.removeItem('points');
                signOut()
                router.push('/');
            }, 3000);
        }

        if (status === 'unauthenticated') {
            router.push('/');
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, error, router, points]);

    // data game
    const [player, setPlayer] = useState(initialPlayer);
    const [messages, setMessages] = useState(player?.warMessages || []);
    const [coordinates, setCoordinates] = useState(war?.allCoordinates);
    const [tiles, setTiles] = useState(war?.tiles);
    const positionPlayer = player?.map.id;
    const positionPlayerX = player?.map.position_x;
    const positionPlayerY = player?.map.position_y;
    const [playerLevelChoices, setPlayerLevelChoices] = useState(player?.levelChoices || []);
    // État pour stocker les compétences du joueur
    const [playerSkill, setPlayerSkill] = useState(player?.warPlayerSkills);
    // Etat pour stocker item joueur
    const [playerItem, setPlayerItem] = useState(player?.warPlayerItems);
    // Temps restant avant la résurrection du joueur
    const [timeRemaining, setTimeRemaining] = useState(0);

    useEffect(() => {
        if (player.isDied != null) {
            const remaining = calculateTimeRemaining(player.isDied);
            setTimeRemaining(remaining);

            const interval = setInterval(() => {
                const remaining = calculateTimeRemaining(player.isDied);
                if (remaining <= 0) {
                    clearInterval(interval);
                    setTimeRemaining(0);
                } else {
                    setTimeRemaining(remaining);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [player]);

    useEffect(() => {
        // Initialize selectedPassiveSkills with already selected skills
        const initiallySelected = playerSkill?.filter(skill => skill.warSkills.type === 'passif' && skill.isSelected)
            .map(skill => skill);
        setSelectedPassiveSkills(initiallySelected);
    }, [playerSkill]);

    // Fonction pour gérer le clic sur un sort passif
    const togglePassiveSkill = (skill) => {
        if (selectedPassiveSkills.includes(skill)) {
            setSelectedPassiveSkills(selectedPassiveSkills.filter(s => s !== skill));
        } else if (selectedPassiveSkills.length < 5) {
            setSelectedPassiveSkills([...selectedPassiveSkills, skill]);
        }
    };

    // Fonction utilitaire pour calculer le temps restant
    const calculateTimeRemaining = (endTime) => {
        const now = new Date();
        const end = new Date(endTime);
        return Math.max(0, end - now);
    };

    // Fonction pour gérer le clic sur un joueur de la liste
    const handleClickPlayer = (player) => {
        // Mettre à jour l'état avec les informations du joueur sélectionné
        setSelectedPlayer(player);
        // Ouvrir la modal
        setIsModalOpen(true);
    };

    // Fonction pour gérer le clic sur un monstre de la liste
    const handleClickMonster = (monster) => {
        // Mettre à jour l'état avec les informations du monstre sélectionné
        setSelectedMonster(monster);
        // Ouvrir la modal
        setIsModalOpen(true);
    };

    const handleSelectFightSpell = (spell) => {
        if (selectedPlayer) {
            attackPlayer(selectedPlayer.petId, spell.skillId);
        } else if (selectedMonster) {
            attackMonster(selectedMonster.id, spell.skillId);
        } else {
            setAlertMessage('Veuillez sélectionner un joueur ou un monstre pour attaquer');
            setAlertType('error');
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 5000);
        }
    }

    const handleClickItem = (item) => {
        console.log('item', item)
        setSelectedItem(item);
        setQuantity(1);
        setIsModalItems(true);
    };

    const handleClickFight = () => {
        setIsModalFight(true);
    }

    const handleClickSpell = () => {
        setIsModalSpell(true);
    }

    const handleClickItems = () => {
        setIsModalItems(true);
    }

    const handleClickMessage = () => {
        setIsModalMessage(true);
    }

    const handleMouseEnter = (skill) => {
        setHoveredSkill(skill);
    };

    const handleMouseLeave = () => {
        setHoveredSkill(null);
    };

    const handleMouseEnterItem = (item) => {
        setHoveredItem(item);
    };

    const handleMouseLeaveItem = () => {
        setHoveredItem(null);
    }

    // Fonction pour sauvegarder les compétences passives sélectionnées
    const saveSelectedPassiveSkills = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`/api/war/player/saveSpells`, {
                spells: selectedPassiveSkills,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.customJwt}`,
                }
            });
            const updatedPlayerSkills = await response.data;
            setPlayerSkill(updatedPlayerSkills.updatedPlayerSkills)
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // Gestionnaire d'événements pour le clic sur une tuile
    const handleClickTile = (tile) => {
        setIsModalOpen(false);
        // Filtrer les joueurs et les monstres présents sur la tuile cliquée
        const playersOnTile = tile.warPlayers || [];
        setSelectedTilePlayers(playersOnTile);
        setSelectedTileMonsters(tile.warMonsters || [])

        // Stocker les coordonnées de la tuile sélectionnée
        setSelectedTileX(tile.position_x);
        setSelectedTileY(tile.position_y);

        setIsModalOpen(true);
    };

    // Fonction pour fermer la fenêtre modale
    const closeModal = () => {
        // setIsModalOpen(false);
        setSelectedTilePlayers(null);
        setSelectedTileMonsters(null);
    };

    // Fonction pour fermer la fenêtre modale de joueur
    const closeModalPlayer = () => {
        setSelectedPlayer(null);
    };

    // Fonction pour fermer la fenêtre modale de monstre
    const closeModalMonster = () => {
        setSelectedMonster(null);
    };

    // Fonction pour fermer la fenêtre modale de message
    const closeModalMessage = () => {
        setIsModalMessage(false);
    };

    // Fonction pour fermer le menu de déplacement
    const closeMoveMenu = () => {
        setIsMenuMoveOpen(false);
    };

    // Fonction pour fermer la fenêtre modale de compétences
    const closeModalSpell = () => {
        setSelectedPassiveSkills(playerSkill.filter(skill => skill.warSkills.type === 'passif' && skill.isSelected === true) || []);
        setIsModalSpell(false);
    }

    // Fonction pour fermer la fenêtre modale de combat
    const closeModalFight = () => {
        setIsModalFight(false);
        setSelectedFightSpell(null);
    }

    const closeItemsModal = () => {
        setSelectedItem(null);
        setIsModalItems(false);
    }

    const closeItems = () => {
        setSelectedItem(null)
    }

    // Gestionnaire d'événements pour le clic sur une tuile
    const handleClickMove = () => {
        // Logique pour déterminer les directions disponibles pour le déplacement du joueur
        const directions = {
            up: positionPlayerY < 20,
            down: positionPlayerY > 1,
            left: positionPlayerX > 1,
            right: positionPlayerX < 20
        };
        setAvailableDirections(directions);
        setIsMenuMoveOpen(true);
    };

    // Fonction pour basculer l'état du menu
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };
    // Fonction pour déplacer le joueur
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
        } catch (error) {
            setAlertMessage(`${error.response.data.message}`);
            setAlertType('error');
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 5000);
        } finally {
            setLoading(false);
        }
    }

    // Fonction pour attaquer un joueur
    const attackPlayer = async (opponentId, spellId) => {
        setLoading(true);
        try {
            const response = await axios.post(`/api/war/player/fight`, {
                opponentId, spellId
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.customJwt}`,
                }
            });
            const data = await response.data;

            setShowAlert(false);
            setAlertMessage(data.message);
            if (data.type === 'error') {
                setAlertType('error');
            } else {
                setAlertType('success');
            }
            setPlayer(data.updatedPlayer);
            setTiles(data.tiles);
            setCoordinates(data.allCoordinates);
            setMessages(data.updatedPlayer.warMessages);
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 7000);
        } catch (error) {
            setShowAlert(false);
            setAlertMessage(`${error.response.data.message}`);
            setAlertType('error');
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
                router.reload();
            }, 5000);

        } finally {
            setLoading(false);
        }
    }

    // Fonction pour attaquer un monstre
    const attackMonster = async (monsterId, spellId) => {
        setLoading(true);
        try {
            const response = await axios.post(`/api/war/player/fightMonster`, {
                monsterId, spellId
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.customJwt}`,
                }
            });
            const data = await response.data;
            setShowAlert(false);
            setAlertMessage(data.message);
            if (data.type === 'error') {
                setAlertType('error');
            } else {
                setAlertType('success');
            }
            setPlayer(data.updatedPlayer);
            setTiles(data.tiles);
            setCoordinates(data.allCoordinates);
            setMessages(data.updatedPlayer.warMessages);
            if (data.monster === null) {
                setSelectedMonster(null);
                setIsModalFight(false);
                setSelectedFightSpell(null);
            } else if (data.monster) {
                setSelectedMonster(data.monster);
            }
            setSelectedTileMonsters(data.tile.warMonsters || [])
            setSelectedTilePlayers(data.tile.warPlayers || []);
            setPlayerItem(data.updatedPlayer.warPlayerItems);
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 7000);
        } catch (error) {
            setShowAlert(false);
            setAlertMessage(`${error.response.data.message}`);
            setAlertType('error');
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 5000);
        } finally {
            setLoading(false);
        }
    }

    // Fonction pour level up choice
    const levelUpChoice = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/war/player/level/choices`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.customJwt}`,
                }
            });
            const data = await response.data;

            setShowAlert(false);
            setPoints(data.totalPoints);
            setAlertMessage('Vous avez level Up, choisissez une amélioration');
            setAlertType('success');
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 5000);
            setPlayerLevelChoices(data.levelChoices);
        } catch (error) {
            setShowAlert(false);
            setAlertMessage(`${error.response.data.message}`);
            setAlertType('error');
            setShowAlert(true);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour levelUp
    const levelUp = async (choiceId) => {
        setLoading(true);
        try {
            const response = await axios.post(`/api/war/player/level`, {
                choiceId
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.customJwt}`,
                }
            });
            const data = await response.data;
            setShowAlert(false);
            setAlertMessage(`${data.message}`);
            setAlertType('success');
            setPlayer(data.user);
            setSelectedPlayer(data.user)
            setPlayerLevelChoices([]);
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 7000);
        } catch (error) {
            setShowAlert(false);
            setAlertMessage(`${error.response.data.message}`);
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    // Call pour réssusciter le joueur
    const resurrectPlayer = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/war/player/resurrect`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.customJwt}`,
                }
            });
            const data = await response.data;
            setShowAlert(false);
            setAlertMessage(`${data.message}`);
            setAlertType('success');
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 5000);
            setPlayer(data.playerResurrect);
            setTiles(data.tiles);
            setCoordinates(data.allCoordinates);
            setMessages(data.playerResurrect.warMessages);
        } catch (error) {
            setShowAlert(false);
            setAlertMessage(`${error.response.data.message}`);
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };
    // Call pour utiliser un item
    const useItem = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`/api/war/player/item`, {
                itemId: selectedItem.warItems.id,
                count: quantity,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.customJwt}`,
                }
            });
            const data = await response.data;
            if (data.pointsWin) {
                setPoints(points + data.pointsWin);
            }
            setAlertMessage(data.message);
            setAlertType('success');
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 5000);
            setPlayer(data.updatedUser);
            setPlayerItem(data.updatedUser.warPlayerItems);
            setSelectedItem(null);
        } catch (error) {
            console.log('error', error)
            setAlertMessage(`${error.message}`);
            setAlertType('error');
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 5000);
        } finally {
            setLoading(false);
        }
    };

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

    if (error) {
        return (
            <>
                <HeadView />
                <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
                    <Header points={points} />
                    <div className="flex-grow flex justify-center items-center">
                        <span className="text-center text-red-500">⚠ {error}</span>
                    </div>
                </div>
            </>
        );
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

    if (session) {
        // Créer une liste de tuiles en incluant les tuiles vides
        const tilesWithEmpty = coordinates.map(({ position_x, position_y }) => {
            const key = `${position_x},${position_y}`;
            const matchingTile = tiles.find(tile => tile.position_x === position_x && tile.position_y === position_y);
            return matchingTile || { position_x, position_y, image_url: "", alt: "" };
        });

        // Trier les tuiles en fonction de leur position X et Y croissantes
        const sortedTiles = tilesWithEmpty.sort((a, b) => {
            if (a.position_y !== b.position_y) {
                return b.position_y - a.position_y;
            }
            return a.position_x - b.position_x;
        });

        // Fonction pour calculer les statistiques totales du joueur
        const updatedPlayerStats = {
            ...player,
            hp: player.hp + passiveSpellsStats.upHp,
            hpMax: player.hpMax + passiveSpellsStats.upHp,
            str: player.str + passiveSpellsStats.upStr,
            intel: player.intel + passiveSpellsStats.upIntel,
            dex: player.dex + passiveSpellsStats.upDex,
            acu: player.acu + passiveSpellsStats.upAcu,
            crit: player.crit + passiveSpellsStats.upCrit,
            regen: player.regen + passiveSpellsStats.upRegen,
            defP: player.defP + passiveSpellsStats.upDefP,
            defPStand: player.defPStand + passiveSpellsStats.upDefPStand,
            defM: player.defM + passiveSpellsStats.upDefM,
            defMStand: player.defMStand + passiveSpellsStats.upDefMStand,
            defStrike: player.defStrike + passiveSpellsStats.upDefStrike,
            defFire: player.defFire + passiveSpellsStats.upDefFire,
            defSlash: player.defSlash + passiveSpellsStats.upDefSlash,
            defLightning: player.defLightning + passiveSpellsStats.upDefLightning,
            defPierce: player.defPierce + passiveSpellsStats.upDefPierce,
            defHoly: player.defHoly + passiveSpellsStats.upDefHoly
        };
        // Fonction pour calculer la distance entre le joueur et un adversaire
        const formatTime = (ms) => {
            const totalSeconds = Math.floor(ms / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            return `${hours}h ${minutes}m ${seconds}s`;
        };
        // Fonction pour formater les statistiques de choix pour level du joueur
        const formatStats = (option) => {
            const stats = [];
            if (option.str > 0) stats.push(`Force: ${option.str}`);
            if (option.intel > 0) stats.push(`Intelligence: ${option.intel}`);
            if (option.hp > 0) stats.push(`Vie: ${option.hp}`);
            if (option.dex > 0) stats.push(`Dextérité: ${option.dex}`);
            if (option.acu > 0) stats.push(`Acuité: ${option.acu}`);
            if (option.defP > 0) stats.push(`Défense Physique: ${option.defP}`);
            if (option.defM > 0) stats.push(`Résistance Magique: ${option.defM}`);
            return stats;
        };

        return (
            <>
                <HeadView />
                <Script src="https://kit.fontawesome.com/261e37c4a6.js" crossorigin="anonymous"></Script>
                <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
                    <Header points={points} />
                    <div className="grid grid-cols-11">
                        {/* Afficher les tuiles autour du joueur dans l'ordre croissant de distance relative au joueur */}
                        {sortedTiles.map((tile, index) => {
                            // Trouver le premier joueur vivant sur la tuile
                            const alivePlayer = tile.warPlayers ? tile.warPlayers.find(player => player.isDied === null) : null;

                            return (
                                <div key={index} className="relative cursor-pointer" onClick={() => handleClickTile(tile)}>
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
                                    ) : alivePlayer ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div style={{ width: 'auto', height: 'auto', maxWidth: '80%', maxHeight: '80%' }}>
                                                <Image
                                                    src={alivePlayer.imageUrl}
                                                    alt={alivePlayer.name}
                                                    className="rounded-full"
                                                    layout="fill"
                                                />
                                            </div>
                                        </div>
                                    ) : tile.warMonsters && tile.warMonsters.length > 0 ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="relative w-3/4 h-3/4">
                                                <Image
                                                    src={tile.warMonsters[0].monsters.imageUrl}
                                                    alt={tile.warMonsters[0].monsters.name}
                                                    layout="fill"
                                                    className="rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}

                    </div>

                    {isModalOpen && selectedTilePlayers && selectedPlayer === null && selectedMonster === null && (
                        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 text-black z-10">
                            <div className="bg-white p-4 rounded-lg relative w-3/4 h-3/4 max-h-3/4 overflow-auto">
                                <h2 className="text-lg font-bold mb-4 text-center">X {selectedTileX}, Y {selectedTileY}</h2>
                                <h3 className="text-lg mb-2 text-center">{selectedTilePlayers.length > 0 ? "Joueur" : "Aucun joueur"}</h3>
                                <ul className="flex flex-col">
                                    {selectedTilePlayers.map((playerTile, index) => {
                                        const alivePlayer = playerTile.isDied === null;
                                        if (!alivePlayer) return null; // Ne pas afficher les joueurs morts

                                        return (
                                            <li key={index}
                                                className={`flex items-center p-2 border-b ${playerTile.petId !== player.petId ? "cursor-pointer" : ''}`}
                                                onClick={playerTile.petId !== player.petId ? () => handleClickPlayer(playerTile) : null}
                                            >
                                                {/* Image du joueur */}
                                                <img
                                                    src={playerTile.imageUrl}
                                                    alt={playerTile.name}
                                                    className="w-20 h-20 rounded-full mr-2"
                                                />
                                                {/* Nom du joueur */}
                                                {playerTile.name}
                                            </li>
                                        );
                                    })}
                                </ul>
                                <h3 className="text-lg mb-2 text-center">{selectedTileMonsters.length > 0 ? "Monstres" : "Aucun monstre"}</h3>
                                <ul className="flex flex-col">
                                    {selectedTileMonsters.map((monsterTile, index) => (
                                        <li key={index}
                                            className="flex items-center p-2 border-b cursor-pointer"
                                            onClick={() => handleClickMonster(monsterTile)}
                                        >
                                            {/* Image du monstre */}
                                            <img
                                                src={monsterTile.monsters.imageUrl}
                                                alt={monsterTile.monsters.name}
                                                className="w-20 h-20 rounded-full mr-2"
                                            />
                                            {/* Nom du monstre */}
                                            {monsterTile.monsters.name}
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
                    {isModalOpen && selectedPlayer && !isModalFight && (
                        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 text-black z-10">
                            <div className="bg-white p-4 rounded-lg relative w-3/4 h-3/4 max-h-3/4 overflow-auto">

                                {/* Image du joueur */}
                                <img
                                    src={selectedPlayer.imageUrl}
                                    alt={selectedPlayer.name}
                                    className="lg:w-32 lg:h-32 md:w-24 md:h-24 h-16 w-16 rounded-full mx-auto mb-2"
                                />
                                {/* Nom du joueur */}
                                <h2 className="text-xl font-bold text-center mb-2">{selectedPlayer.name}</h2>
                                {/* Stats du joueur */}
                                {selectedPlayer.petId != player.petId ? (
                                    <div className="font-bold text-center mb-4">Level : {selectedPlayer.level}</div>

                                ) : (
                                    <>
                                        <div className="mt-4">
                                            <div className="flex flex-col sm:flex-row justify-center">
                                                <div className="flex-1 text-center mb-2 sm:mb-0 sm:mr-4">
                                                    <p className="font-bold">Vie</p>
                                                    <p>{updatedPlayerStats.hp}/{updatedPlayerStats.hpMax}</p>
                                                    <div className="relative h-2.5 rounded-full bg-gray-300">
                                                        <div
                                                            className="bg-red-600 h-2.5 rounded-full"
                                                            style={{ width: `${(updatedPlayerStats.hp / updatedPlayerStats.hpMax) * 100}%` }}>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 text-center">
                                                    <p className="font-bold">Level</p>
                                                    <p>{selectedPlayer.level}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <div className="flex flex-col sm:flex-row justify-center">
                                                <div className="flex-1 text-center mb-2 sm:mb-0 sm:mr-4">
                                                    <p className="font-bold">XP</p>
                                                    <div className="relative h-2.5 rounded-full bg-gray-300">
                                                        <div
                                                            className="bg-blue-600 h-2.5 rounded-full"
                                                            style={{ width: `${Math.min((selectedPlayer.xp / xpToNextLevel(selectedPlayer.level)) * 100, 100)}%` }}>
                                                        </div>
                                                    </div>
                                                    <p>{selectedPlayer.xp}/{xpToNextLevel(selectedPlayer.level)} XP</p>
                                                    {selectedPlayer.xp >= xpToNextLevel(selectedPlayer.level) && (
                                                        <div className="mt-2">
                                                            <i className="cursor-pointer fa fa-level-up text-yellow-500" disabled={calculatePoints(player) < selectedPlayer.level * 10} onClick={levelUpChoice}> level up pour {selectedPlayer.level * 10} OC</i>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <div className="flex flex-col sm:flex-row justify-center">
                                                <div className="flex-1 text-center mb-2 sm:mb-0 sm:mr-4 relative group">
                                                    <p className="font-bold">Force</p>
                                                    <p>{updatedPlayerStats.str}</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        Influe sur les dégats physiques
                                                    </div>
                                                </div>
                                                <div className="flex-1 text-center relative group">
                                                    <p className="font-bold">Intelligence</p>
                                                    <p>{updatedPlayerStats.intel}</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        Influe sur les dégats magiques
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <div className="flex flex-col sm:flex-row justify-center">
                                                <div className="flex-1 text-center mb-2 sm:mb-0 sm:mr-4 relative group">
                                                    <p className="font-bold">Dextérité</p>
                                                    <p>{updatedPlayerStats.dex}</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        Permet d&apos;esquiver les attaques physiques
                                                    </div>
                                                </div>
                                                <div className="flex-1 text-center relative group">
                                                    <p className="font-bold">Acuité</p>
                                                    <p>{updatedPlayerStats.acu}</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        Permet de bloquer les attaques magiques
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <div className="flex flex-col sm:flex-row justify-center">
                                                <div className="flex-1 text-center mb-2 sm:mb-0 sm:mr-4">
                                                    <p className="font-bold">Chance de Critique</p>
                                                    <p>{updatedPlayerStats.crit} %</p>
                                                </div>
                                                <div className="flex-1 text-center mb-2 sm:mb-0 sm:mr-4 relative group">
                                                    <p className="font-bold">Chance de Toucher</p>
                                                    <p>+{updatedPlayerStats.hit} %</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        S&apos;additionne aux chance de toucher de chaque sort (max 95%)
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <div className="flex flex-col sm:flex-row justify-center">
                                                <div className="flex-1 text-center mb-2 sm:mb-0 sm:mr-4 relative group">
                                                    <p className="font-bold">Points d&apos;Action</p>
                                                    <p>{updatedPlayerStats.pa}</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        Récupération de 4 PA par heure (max {updatedPlayerStats.paMax})
                                                    </div>
                                                </div>
                                                <div className="flex-1 text-center relative group">
                                                    <p className="font-bold">Régénération</p>
                                                    <p>{updatedPlayerStats.regen}</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        Récupération de {updatedPlayerStats.regen} points de vie par heure
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <p className="font-bold text-center mb-2">Défense Globale</p>
                                            <div className="flex flex-col sm:flex-row justify-center">
                                                <div className="flex-1 text-center mb-2 sm:mb-0 sm:mr-4">
                                                    <p className="font-bold">Défense Physique</p>
                                                    <p>{updatedPlayerStats.defP}</p>
                                                </div>
                                                <div className="flex-1 text-center">
                                                    <p className="font-bold">Défense Magique</p>
                                                    <p>{updatedPlayerStats.defM}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 mb-8">
                                            <p className="font-bold text-center mb-2">Défense Générale</p>
                                            <div className="flex flex-col sm:flex-row justify-center mb-2">
                                                <div className="flex-1 text-center mb-2 sm:mb-0 sm:mr-4 relative group">
                                                    <p className="font-bold">Défense Standard</p>
                                                    <p>{updatedPlayerStats.defPStand + updatedPlayerStats.defP}</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        {updatedPlayerStats.defPStand} + {updatedPlayerStats.defP} = {calculateDef(updatedPlayerStats, 'Pstandard')}% de réduction (max 80%)
                                                    </div>
                                                </div>
                                                <div className="flex-1 text-center relative group">
                                                    <p className="font-bold">Résistance Standard</p>
                                                    <p>{updatedPlayerStats.defMStand + updatedPlayerStats.defM}</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        {updatedPlayerStats.defMStand} + {updatedPlayerStats.defM} = {calculateDef(updatedPlayerStats, 'Mstandard')}% de réduction (max 80%)
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row justify-center mb-2">
                                                <div className="flex-1 text-center mb-2 sm:mb-0 sm:mr-4 relative group">
                                                    <p className="font-bold">Défense Perçante</p>
                                                    <p>{updatedPlayerStats.defPierce + updatedPlayerStats.defP}</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        {updatedPlayerStats.defPierce} + {updatedPlayerStats.defP} = {calculateDef(updatedPlayerStats, 'Pierce')}% de réduction (max 80%)
                                                    </div>
                                                </div>
                                                <div className="flex-1 text-center relative group">
                                                    <p className="font-bold">Résistance Feu</p>
                                                    <p>{updatedPlayerStats.defFire + updatedPlayerStats.defM}</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        {updatedPlayerStats.defFire} + {updatedPlayerStats.defM} = {calculateDef(updatedPlayerStats, 'Fire')}% de réduction (max 80%)
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row justify-center mb-2">
                                                <div className="flex-1 text-center mb-2 sm:mb-0 sm:mr-4 relative group">
                                                    <p className="font-bold">Défense Tranchante</p>
                                                    <p>{updatedPlayerStats.defSlash + updatedPlayerStats.defP}</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        {updatedPlayerStats.defSlash} + {updatedPlayerStats.defP} = {calculateDef(updatedPlayerStats, 'Slash')}% de réduction (max 80%)
                                                    </div>
                                                </div>
                                                <div className="flex-1 text-center relative group">
                                                    <p className="font-bold">Résistance Foudre</p>
                                                    <p>{updatedPlayerStats.defLightning + updatedPlayerStats.defM}</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        {updatedPlayerStats.defLightning} + {updatedPlayerStats.defM} = {calculateDef(updatedPlayerStats, 'Lightning')}% de réduction (max 80%)
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row justify-center mb-2">
                                                <div className="flex-1 text-center mb-2 sm:mb-0 sm:mr-4 relative group">
                                                    <p className="font-bold">Défense Percutante</p>
                                                    <p>{updatedPlayerStats.defStrike + updatedPlayerStats.defP}</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        {updatedPlayerStats.defHoly} + {updatedPlayerStats.defP} = {calculateDef(updatedPlayerStats, 'Strike')}% de réduction (max 80%)
                                                    </div>
                                                </div>
                                                <div className="flex-1 text-center relative group">
                                                    <p className="font-bold">Résistance Sacrée</p>
                                                    <p>{updatedPlayerStats.defHoly + updatedPlayerStats.defM}</p>
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                        {updatedPlayerStats.defHoly} + {updatedPlayerStats.defM} = {calculateDef(updatedPlayerStats, 'Holy')}% de réduction (max 80%)
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </>
                                )}
                                {/* Bouton pour fermer le menu */}
                                {selectedPlayer.petId != player.petId ? (
                                    <div className="flex justify-center absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                        <button className="bg-green-500 text-white py-2 px-4 rounded mr-4" onClick={handleClickFight}>Attaquer</button>
                                        <button onClick={closeModalPlayer} className="bg-red-500 text-white py-2 px-4 rounded">Fermer</button>
                                    </div>
                                ) : (
                                    <div className="relative w-full mt-4">
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                                            <button onClick={closeModalPlayer} className="bg-red-500 text-white py-2 px-4 rounded">Fermer</button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    )}
                    {isModalOpen && selectedMonster && !isModalFight && (
                        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 text-black z-10">
                            <div className="bg-white p-4 rounded-lg relative w-3/4 h-3/4 max-h-3/4 overflow-auto">
                                <h2 className="text-lg font-bold mb-4 text-center">{selectedMonster.monsters.name}</h2>


                                <img
                                    src={selectedMonster.monsters.imageUrl}
                                    alt={selectedMonster.monsters.name}
                                    className="lg:w-32 lg:h-32 md:w-24 md:h-24 h-16 w-16 mx-auto mb-2"
                                />

                                <div className="flex flex-col items-center mt-4">
                                    <p className="font-bold">Niveau {selectedMonster.level}</p>
                                    <p>Vie: {selectedMonster.hp}/{selectedMonster.hpMax}</p>
                                    <div className="relative h-2.5 rounded-full bg-gray-300 w-3/4">
                                        <div
                                            className="bg-red-600 h-2.5 rounded-full"
                                            style={{ width: `${(selectedMonster.hp / selectedMonster.hpMax) * 100}%` }}>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="flex flex-col sm:flex-row justify-center">
                                        <div className="flex-1 text-center mb-2 sm:mb-0 sm:mr-4 relative group">
                                            <p className="font-bold">Force</p>
                                            <p>{selectedMonster.str}</p>
                                            <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                Influe sur les dégâts physiques
                                            </div>
                                        </div>
                                        <div className="flex-1 text-center relative group">
                                            <p className="font-bold">Intelligence</p>
                                            <p>{selectedMonster.intel}</p>
                                            <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                Influe sur les dégâts magiques
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="flex flex-col sm:flex-row justify-center">
                                        <div className="flex-1 text-center mb-2 sm:mb-0 sm:mr-4 relative group">
                                            <p className="font-bold">Dextérité</p>
                                            <p>{selectedMonster.dex}</p>
                                            <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                Permet d'esquiver les attaques physiques
                                            </div>
                                        </div>
                                        <div className="flex-1 text-center relative group">
                                            <p className="font-bold">Acuité</p>
                                            <p>{selectedMonster.acu}</p>
                                            <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                                                Permet de bloquer les attaques magiques
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Bouton pour fermer le menu */}
                                <div className="relative w-full mt-12">
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                                        <button className="bg-green-500 text-white py-2 px-4 rounded mr-4" onClick={handleClickFight}>Attaquer</button>
                                        <button onClick={closeModalMonster} className="bg-red-500 text-white py-2 px-4 rounded">Fermer</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {isMenuMoveOpen && (
                        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 text-black z-10">
                            <div className="bg-white p-4 rounded-lg relative w-3/4 h-3/4 max-h-3/4 overflow-auto flex flex-col justify-between">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold">Déplacer le joueur</h2>
                                    <span>(Coute 3 PA)</span>
                                </div>
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
                    {isModalFight && (
                        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 text-black z-10">
                            <div className="bg-white p-4 rounded-lg relative w-3/4 h-3/4 max-h-3/4 overflow-auto">
                                <h2 className="text-lg font-bold text-center mb-4">Sélectionner un Sort/Compétence pour attaquer {selectedPlayer ? selectedPlayer.name : selectedMonster.name}</h2>
                                <ul className="flex flex-col">
                                    {playerSkill.filter(skill => skill.warSkills.type === 'actif').map((skill, index) => (
                                        <li key={index}
                                            className={`flex items-center cursor-pointer p-2 border-b ${selectedFightSpell === skill ? 'bg-gray-200' : ''}`}
                                            onClick={() => setSelectedFightSpell(skill)}
                                        >
                                            <div className="flex items-center">
                                                <div className="relative w-20 h-20 mr-2">
                                                    <Image
                                                        src={skill.warSkills.img}
                                                        alt={`${skill.warSkills.name} icon`}
                                                        layout="fill"
                                                        objectFit="contain"
                                                    />
                                                </div>
                                                <span className="font-bold">{skill.warSkills.name} ({skill.warSkills.cost} PA)</span>
                                                <span className={`${skill.warSkills.stat === 'str' ? 'text-orange-500' : 'text-green-500'} ml-2 md:ml-4`}>
                                                    {calculateDmg(updatedPlayerStats, skill.warSkills.stat, skill.warSkills.dmgMin, skill.warSkills.divider)} - {calculateDmg(updatedPlayerStats, skill.warSkills.stat, skill.warSkills.dmgMax, skill.warSkills.divider)} dmg
                                                </span>
                                                <span className="ml-2 text-red-500 md:ml-4">
                                                    Crit {calculateDmg(updatedPlayerStats, skill.warSkills.stat, skill.warSkills.crit, skill.warSkills.divider)} dmg
                                                </span>
                                                <span className="ml-2 md:ml-4">
                                                    Portée {skill.warSkills.dist}
                                                </span>
                                                <span className="ml-2 md:ml-4 text-gray-500">
                                                    Touché {Math.min(skill.warSkills.hit + updatedPlayerStats.hit, 95)} %
                                                </span>
                                                <span className="ml-2">
                                                    Type de dégats: {skill.warSkills.dmgType}
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
                                {/* Bouton pour fermer la fenêtre modale */}
                                <div className="flex justify-center absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                    <button disabled={selectedFightSpell === null} onClick={() => handleSelectFightSpell(selectedFightSpell)} className={`bg-green-500 text-white py-2 px-4 rounded mr-4 ${selectedFightSpell === null ? 'bg-stone-500' : ''}`}>Confirmer</button>
                                    <button onClick={closeModalFight} className="bg-red-500 text-white py-2 px-4 rounded">Retour</button>
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
                                            <ul className="flex flex-col">
                                                {playerSkill
                                                    .filter(skill => skill.warSkills.type === 'actif')
                                                    .map((skill, index) => (
                                                        <li
                                                            key={index}
                                                            className="mt-2 group relative cursor-pointer p-2"
                                                            onMouseEnter={() => handleMouseEnter(skill)}
                                                            onMouseLeave={handleMouseLeave}
                                                        >
                                                            <div className="flex items-center">
                                                                <div className="relative w-20 h-20 mr-2">
                                                                    <Image
                                                                        src={skill.warSkills.img}
                                                                        alt={`${skill.warSkills.name} icon`}
                                                                        layout="fill"
                                                                        objectFit="contain"
                                                                    />
                                                                </div>
                                                                <span className="font-bold">{skill.warSkills.name} ({skill.warSkills.cost} PA)</span>
                                                                <span className={`${skill.warSkills.stat === 'str' ? 'text-orange-500' : 'text-green-500'} ml-2 md:ml-4`}>
                                                                    {calculateDmg(player, skill.warSkills.stat, skill.warSkills.dmgMin, skill.warSkills.divider)} - {calculateDmg(player, skill.warSkills.stat, skill.warSkills.dmgMax, skill.warSkills.divider)} dmg
                                                                </span>
                                                                <span className="ml-2 text-red-500 md:ml-4">
                                                                    Crit {calculateDmg(player, skill.warSkills.stat, skill.warSkills.crit, skill.warSkills.divider)} dmg
                                                                </span>
                                                                <span className="ml-2 md:ml-4">
                                                                    Portée {skill.warSkills.dist}
                                                                </span>
                                                                <span className="ml-2">
                                                    Type de dégats: {skill.warSkills.dmgType}
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
                                            <ul className="flex flex-col w-full">
                                                <span className="text-center">(Vous pouvez sélectionner jusqu'à 5 sorts passifs)</span>
                                                {playerSkill
                                                    .filter(skill => skill.warSkills.type === 'passif')
                                                    .map((skill, index) => (
                                                        <li
                                                            key={index}
                                                            className={`mt-2 group relative cursor-pointer p-2 ${selectedPassiveSkills.includes(skill) ? 'bg-gray-300' : ''}`}
                                                            onClick={() => togglePassiveSkill(skill)}
                                                        >
                                                            <span className="font-bold">{skill.warSkills.name}</span>
                                                            <span className="mx-2">
                                                                {skill.warSkills.upStr > 0 && <span>+{skill.warSkills.upStr} Force </span>}
                                                                {skill.warSkills.upIntel > 0 && <span>+{skill.warSkills.upIntel} Intelligence </span>}
                                                                {skill.warSkills.upDex > 0 && <span>+{skill.warSkills.upDex} Dextérité </span>}
                                                                {skill.warSkills.upAcu > 0 && <span>+{skill.warSkills.upAcu} Acuité </span>}
                                                                {skill.warSkills.upHp > 0 && <span>+{skill.warSkills.upHp} Vie</span>}
                                                                {skill.warSkills.upCrit > 0 && <span>+{skill.warSkills.upCrit} % Chance de critique </span>}
                                                                {skill.warSkills.upDefP > 0 && <span>+{skill.warSkills.upDefP} Défense physique </span>}
                                                                {skill.warSkills.upDefM > 0 && <span>+{skill.warSkills.upDefM} Défense magique </span>}
                                                                {skill.warSkills.upDefPStand > 0 && <span>+{skill.warSkills.upDefPStand} Défense standard </span>}
                                                                {skill.warSkills.upDefMStand > 0 && <span>+{skill.warSkills.upDefMStand} Résistance standard </span>}
                                                                {skill.warSkills.upDefPierce > 0 && <span>+{skill.warSkills.upDefPierce} Défense perçante </span>}
                                                                {skill.warSkills.upDefFire > 0 && <span>+{skill.warSkills.upDefFire} Résistance feu </span>}
                                                                {skill.warSkills.upDefSlash > 0 && <span>+{skill.warSkills.upDefSlash} Défense tranchante </span>}
                                                                {skill.warSkills.upDefLightning > 0 && <span>+{skill.warSkills.upDefLightning} Résistance foudre </span>}
                                                                {skill.warSkills.upDefStrike > 0 && <span>+{skill.warSkills.upDefStrike} Défense percutante </span>}
                                                                {skill.warSkills.upDefHoly > 0 && <span>+{skill.warSkills.upDefHoly} Résistance sacrée </span>}
                                                                {skill.warSkills.upHit > 0 && <span>+{skill.warSkills.upHit} % Chance de toucher </span>}
                                                                {skill.warSkills.upRegen > 0 && <span>+{skill.warSkills.upRegen} Régénération </span>}
                                                            </span>
                                                        </li>
                                                    ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                                {/* Bouton pour fermer le menu */}
                                <div className="relative w-full mt-4">
                                    <div className="flex justify-center absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                        <button onClick={saveSelectedPassiveSkills} className="bg-green-500 text-white py-2 px-4 rounded text-xl mr-4">Sauvegarder</button>
                                        <button onClick={closeModalSpell} className="bg-red-500 text-white py-2 px-4 rounded text-xl">Fermer</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {isModalMessage && (
                        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 text-black z-10">
                            <div className="bg-white p-4 rounded-lg relative w-3/4 h-3/4 max-h-3/4 overflow-auto flex flex-col justify-between">
                                <h2 className="text-2xl font-bold mb-8 text-center">Messages</h2>
                                <div className="flex flex-col items-center space-y-4 mb-8 w-full">
                                    <div className="w-full">
                                        <ul className="flex flex-col">
                                            {messages.map((message, index) => (
                                                <li key={index} className="mt-2">
                                                    <div className="flex items-center">
                                                        <span className="font-bold">{new Date(message.createdAt).toLocaleString()}</span>
                                                        <span className="ml-2">{message.message}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                {/* Bouton pour fermer la modal messages */}
                                <div className="relative w-full mt-4">
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                                        <button onClick={closeModalMessage} className="bg-red-500 text-white py-2 px-4 rounded text-xl">Fermer</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {isModalItems && selectedItem === null && (
                        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 text-black z-10">
                            <div className="bg-white p-4 rounded-lg relative w-3/4 h-3/4 max-h-3/4 overflow-auto">
                                <h2 className="text-lg font-bold mb-4 text-center">Items du joueur</h2>
                                <ul className="flex flex-col w-full">
                                    {playerItem.length > 0 ? (
                                        playerItem.map((item, index) => (
                                            <li
                                                key={index}
                                                className="flex items-center p-2 border-b relative cursor-pointer"
                                                onMouseEnter={() => handleMouseEnterItem(item)}
                                                onMouseLeave={handleMouseLeaveItem}
                                                onClick={() => handleClickItem(item)}
                                            >
                                                <img
                                                    src={item.warItems.imageUrl}
                                                    alt={item.warItems.name}
                                                    className="w-12 h-12 mr-2"
                                                />
                                                <div>
                                                    <span className="font-bold">{item.warItems.name}</span>
                                                    <span> - Quantité : {item.count}</span>
                                                </div>
                                                {hoveredItem === item && (
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 p-2 bg-gray-700 text-white rounded shadow-lg w-48">
                                                        {item.warItems.description}
                                                    </div>
                                                )}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-center">Aucun item</li>
                                    )}
                                </ul>
                                <div className="flex justify-center absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                    <button onClick={closeItemsModal} className="bg-red-500 text-white py-2 px-4 rounded">Fermer</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {isModalItems && selectedItem && (
                        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 text-black z-10">
                            <div className="bg-white p-4 rounded-lg relative w-3/4 h-3/4 max-h-3/4 overflow-auto">
                                <h2 className="text-lg font-bold mb-4 text-center">{selectedItem.warItems.name}</h2>
                                <img
                                    src={selectedItem.warItems.imageUrl}
                                    alt={selectedItem.warItems.name}
                                    className="w-32 h-32 mx-auto mb-4"
                                />
                                <div className="flex flex-col items-center">
                                    <span className="font-bold">Description:</span>
                                    <p>{selectedItem.warItems.description}</p>
                                </div>
                                <div className="flex flex-col items-center mt-4">
                                    {selectedItem.warItems.id != 1 ? (
                                        <>
                                            <input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value, 10), selectedItem.warItems.id === 12 ? selectedItem.count : Math.min(selectedItem.count, 10))))}
                                                min={1}
                                                max={selectedItem.warItems.id === 12 ? selectedItem.count : Math.min(selectedItem.count, 10)}
                                                className="w-20 p-2 border rounded text-center"
                                            />
                                            {selectedItem.warItems.pa && (
                                                <>
                                                <span className="mt-4">Vos Points d'Action : {updatedPlayerStats.pa}/{updatedPlayerStats.paMax}</span>
                                                <span className="text-center">Vous regagnez : {selectedItem.warItems.pa * quantity} PA</span>
                                                </>
                                            )}
                                            {selectedItem.warItems.hp && (
                                                <>
                                                <span className="mt-4">Votre vie : {updatedPlayerStats.hp}/{updatedPlayerStats.hpMax}</span>
                                                <span className="text-center">Vous regagnez : {selectedItem.warItems.hp * quantity} PV</span>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <span>Quantité : {selectedItem.count}</span>
                                    )}
                                </div>
                                <div className="flex justify-center absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                    {selectedItem.warItems.id != 1 && (
                                        <button onClick={useItem} className="bg-green-500 text-white py-2 px-4 rounded mr-4">Utiliser</button>
                                    )}
                                    <button onClick={closeItems} className="bg-red-500 text-white py-2 px-4 rounded">Retour</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Joueur mort */}
                    {player.isDied && (
                        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 text-black z-10">
                            <div className="bg-white p-4 rounded-lg relative w-3/4 h-3/4 max-h-3/4 overflow-auto flex flex-col ">
                                <h2 className="text-2xl font-bold mb-8 text-center">Vous êtes mort</h2>
                                <div className="flex flex-col items-center justify-center space-y-4 mb-8 w-full">
                                    <p>Temps restant avant la résurrection : {formatTime(timeRemaining)}</p>
                                    {timeRemaining <= 0 && (
                                        <button onClick={resurrectPlayer} className="bg-green-500 text-white py-2 px-4 rounded">Résurrection</button>
                                    )}
                                    {timeRemaining > 0 && (
                                        <button onClick={resurrectPlayer} disabled={points < player.level * 10} className="bg-red-500 text-white py-2 px-4 rounded">Résusiter maintenant pour {player.level * 10} OC</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {playerLevelChoices.length > 0 && !player.isDied && (
                        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 text-black z-10">
                            <div className="bg-white p-4 rounded-lg relative w-3/4 h-3/4 max-h-3/4 overflow-auto">
                                <h2 className="text-2xl font-bold mb-8 text-center">Choisissez votre amélioration</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {playerLevelChoices.map((option) => (
                                        <div key={option.id} className="flex flex-col items-center border p-4 rounded-lg">
                                            <img src={option.imageUrl} alt={option.name} className="w-16 h-16 mb-2" />
                                            <h3 className="font-bold text-lg">{option.name}</h3>
                                            <ul className="text-left">
                                                {formatStats(option).map((stat, index) => (
                                                    <li key={index}>{stat}</li>
                                                ))}
                                            </ul>
                                            <button
                                                className="bg-green-500 text-white py-2 px-4 rounded mt-2"
                                                onClick={() => levelUp(option.id)}
                                            >
                                                Choisir
                                            </button>
                                        </div>
                                    ))}
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

                        <button className="menu-item flex items-center justify-center"> </button>
                        <button className="menu-item flex items-center justify-center"> <img src="images/run.webp" className="rounded-full h-5/6" alt="Icon 2" onClick={() => handleClickMove()} /> </button>
                        <button className="menu-item flex items-center justify-center"> <img src="images/inventory.webp" className="rounded-full h-5/6" alt="Icon 3" onClick={() => handleClickItems()} /> </button>
                        <button className="menu-item flex items-center justify-center"> <img src="images/player.webp" className="rounded-full h-5/6" alt="Icon 4" onClick={() => handleClickPlayer(player)} /> </button>
                        <button className="menu-item flex items-center justify-center"> <img src="images/spell.webp" className="rounded-full h-5/6" alt="Icon 5" onClick={() => handleClickSpell()} /> </button>
                        <button className="menu-item flex items-center justify-center"> <img src="images/notification.webp" className="rounded-full h-5/6" alt="Icon 5" onClick={() => handleClickMessage()} /> </button>

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
                    {showAlert && (
                        <Alert
                            type={alertType}
                            message={alertMessage}
                            close={setShowAlert}
                        />
                    )}
                </div>
            </>
        );
    }
}

export async function getServerSideProps(context) {
    const session = await getSession(context);

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