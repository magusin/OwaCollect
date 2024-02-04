import React from 'react';
import { useRouter } from 'next/router';
import { useEffect } from "react";
import { signOut, useSession } from 'next-auth/react';
import axios from 'axios';
import calculatePoints from "@/utils/calculatePoints";
import Header from 'C/header';
import Footer from 'C/footer';
import { useDarkMode } from "@/contexts/darkModeContext";
import { getServerSession } from "next-auth";
import nextAuthOptions from "../../config/nextAuthOptions";
import Image from 'next/image';
import Alert from "C/alert";
import axiosInstance from '@/utils/axiosInstance';

export default function Deck({ cards, deckInitial, errorServer }) {
    const [error, setError] = React.useState(errorServer || null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const { darkMode } = useDarkMode();
    const [points, setPoints] = React.useState(0);
    const [playerCards, setPlayerCards] = React.useState(cards);
    const [deck, setDeck] = React.useState(deckInitial);
    const [loading, setLoading] = React.useState(false);
    const [showAlert, setShowAlert] = React.useState(false);
    const [alertType, setAlertType] = React.useState('success');
    const [alertMessage, setAlertMessage] = React.useState('');
    const [link, setLink] = React.useState('');

    // Fonction pour gérer la sélection d'une nouvelle carte pour un emplacement
    const handleSelectCard = (cardId, index) => {
        const newDeck = [...deck];
        // Convertir cardId en un entier avant de le stocker
        newDeck[index] = parseInt(cardId, 10);
        setDeck(newDeck);
    };

    console.log("playerCards:", playerCards)

    const createDuel = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.post('/api/duel', {
                deck
            }, {
                customConfig: { session: session }
            });
            if (response.status === 200) {
                const data = await response.data;
                setLink(data.link);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                setError('Erreur Lors de la création du duel. Veuillez vous reconnecter.')
                setTimeout(() => {
                    signOut()
                    router.push('/');
                }, 3000);
            } else {
                setError('Erreur lors de la création du duel. ' + error);
            }
        } finally {
            setLoading(false);
        }
    }

    const saveDeck = async () => {
        setLoading(true);
        if (deck.some(cardId => cardId === null)) {
            setAlertType('error');
            setAlertMessage("Veuillez sélectionner une carte pour chaque emplacement dans le deck.");
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 5000);
            setLoading(false);
            return;
        } else {
            try {
                const response = await axios.put('/api/user/deck', {
                    deck
                }, {
                    headers: {
                        Authorization: `Bearer ${session.customJwt}`,
                    },
                });
                if (response.status === 200) {
                    const data = await response.data;
                    setAlertType('success');
                    setAlertMessage('Votre deck a bien été sauvegardé.');
                    setShowAlert(true);
                    setTimeout(() => {
                        setShowAlert(false);
                    }, 5000);
                }
            } catch (error) {
                if (error.response.status === 401) {
                    setError('Erreur Lors de la sauvegarde de votre deck.')
                    setTimeout(() => {
                        signOut()
                        router.push('/');
                    }, 3000);
                } else {
                    setError('Erreur lors de l`\'enregistrement du deck. ' + error);
                }
            } finally {

                setLoading(false);
            }
        }
    }

    useEffect(() => {

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

        if (localStorage.getItem('points') != null) {
            setPoints(localStorage.getItem('points'))
        }

        if (localStorage.getItem('points') === null && localStorage.getItem('userOC') != null) {
            const user = JSON.parse(localStorage.getItem('userOC'));
            const calculatedPoints = calculatePoints(user);
            const totalPoints = calculatedPoints - user.pointsUsed;
            localStorage.setItem('points', totalPoints);
            setPoints(totalPoints);
        }

        if (localStorage.getItem('userOC') === null && session) {
            const getUser = async () => {
                try {
                    const response = await axios.get('/api/user', {
                        headers: {
                            Authorization: `Bearer ${session.customJwt}`,
                        },
                    });
                    const data = await response.data;
                    localStorage.setItem('userOC', JSON.stringify(data));
                    const calculatedPoints = calculatePoints(data);
                    const totalPoints = calculatedPoints - data.pointsUsed;
                    localStorage.setItem('points', totalPoints);
                    setPoints(totalPoints);
                } catch (error) {
                    if (error.response.status === 401) {
                        setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
                        setTimeout(() => {
                            signOut()
                            router.push('/');
                        }, 2000);
                    } else {
                        setError(error);
                    }
                }
            };
            getUser();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, session, error, router]);

    if (status === "loading" || loading) {
        return (
            <div className="flex flex-col h-screen">
                <Header points={points} />
                <div className="flex-grow flex justify-center items-center">
                    <span className="text-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="#1f2937" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" /></path></svg></span>
                </div>
                <Footer />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
                <Header points={points} />
                <div className="flex-grow flex justify-center items-center">
                    <span className="text-center text-red-500">⚠ {error}</span>
                </div>
                <Footer />
            </div>
        );
    }

    if (session) {
        // Construire une Map des cartes du joueur
        const cardMap = new Map(playerCards.map(pc => [pc.card.id, pc.card]));

        return (
            <div className="flex flex-col justify-between min-h-screen" >
                <Header points={points} />
                <div className="grid grid-cols-2 gap-4" style={{ marginTop: "80px" }}>
                    {deck.map((cardId, index) => {
                        // Récupérer la carte correspondante depuis la Map
                        const card = cardMap.get(cardId);

                        return (
                            <div key={index}>
                                <div className="flex flex-col">
                                {card ? (
                                    <div className="relative w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] md:w-[200px] md:h-[200px] lg:w-[250px] lg:h-[250px] xl:w-[300px] xl:h-[300px] 2xl:w-[350px] 2xl:h-[350px]">
                                        <Image
                                            src={`${card.picture}.png`}
                                            alt={`Card ${card.name}`}
                                            layout="fill"
                                            objectFit="fill"
                                            sizes="100%"
                                            priority={true}
                                        />
                                    </div>
                                ) : (
                                    <div className="card-placeholder">
                                        <p>Emplacement vide</p>
                                    </div>
                                )}
                                <select
                                    value={cardId || ''}
                                    onChange={(e) => handleSelectCard(e.target.value, index)}
                                    className="mt-2 text-black"
                                >
                                    <option value="">Sélectionnez une carte</option>
                                    {playerCards.map((playerCard) => (
                                        <option key={playerCard.card.id} value={playerCard.card.id} disabled={deck.includes(playerCard.card.id)}>
                                            {playerCard.card.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                             {card && (
                                <div className="flex flex-col ml-4">
                                    <div><strong>Passifs:</strong></div>
                                    {card.passifcards.map((passive, pIndex) => (
                                        <div key={pIndex}>{passive.name} : {passive.passif.description}</div>
                                    ))}
                                    <div><strong>Compétences:</strong></div>
                                    {/* {card.skills.map((skill, sIndex) => (
                                        <div key={sIndex}>{skill}</div>
                                    ))} */}
                                </div>
                            )}
                        </div>
                        );
                    })}
                </div>
                {/* Bouton pour sauvegarder le deck */}
                <div className="flex flex-col justify-center items-center">
                    <button
                        onClick={() => saveDeck()}
                        className="my-4 bg-blue-500 py-2 px-4 rounded mt-12 hover:bg-blue-300"
                        disabled={deckInitial === deck}
                    >
                        Sauvegarder le Deck
                    </button>

                    <button
                        onClick={() => createDuel()}
                        className="my-4 bg-blue-500 py-2 px-4 rounded hover:bg-blue-300"
                    >
                        Générer un duel
                    </button>
                </div>
                {link && (
                    <div className="flex flex-col justify-center items-center">
                        <p className="text-center">Voici le lien de votre duel: <a href={link} target="_blank" rel="noreferrer">{link}</a></p>
                    </div>
                )}
                {showAlert && (
                    <Alert
                        type={alertType}
                        message={alertMessage}
                        close={setShowAlert}
                    />
                )}
                <Footer />
            </div>
        );
    }
}

export async function getServerSideProps(context) {
    const session = await getServerSession(
        context?.req,
        context?.res,
        nextAuthOptions
    );

    if (!session) {
        return {
            props: { errorServer: 'Session expirée reconnectez-vous' },
        };
    }

    try {
        const response = await axios.get(`${process.env.NEXTAUTH_URL}/api/user/deck`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.customJwt}`,
                cookie: context.req.headers.cookie
            }
        })
        const cardsPlayer = await response.data;
        // filtre seulement les cartes rares et epique du tableau playerCards
        const cards = cardsPlayer.filter(pc => pc.card.rarety === 'Rare' || pc.card.rarety === 'Epique');
       
        const deckInitial = cards
            .filter(pc => pc.isInDeck)
            .map(pc => pc.card.id);
        // const cardsObj = new Map(cards.map(card => [card.id, card]));
        // const cardsMap = Object.fromEntries(cardsObj);

        while (deckInitial.length < 4) {
            deckInitial.push(null);
        }
        return {
            props: { cards, deckInitial },
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

