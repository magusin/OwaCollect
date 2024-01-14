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

export default function Duel({ cards, deckInitial, errorServer }) {
    const [error, setError] = React.useState(errorServer || null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const { darkMode } = useDarkMode();
    const [points, setPoints] = React.useState(0);
    const [playerCards, setPlayerCards] = React.useState(cards?.playerCards);
    const [deck, setDeck] = React.useState(deckInitial);
    const [loading, setLoading] = React.useState(false);
    const [showAlert, setShowAlert] = React.useState(false);
    const [alertType, setAlertType] = React.useState('success');
    const [alertMessage, setAlertMessage] = React.useState('');

    // Fonction pour gérer la sélection d'une nouvelle carte pour un emplacement
    const handleSelectCard = (cardId, index) => {
        const newDeck = [...deck];
        // Convertir cardId en un entier avant de le stocker
        newDeck[index] = parseInt(cardId, 10);
        setDeck(newDeck);
    };

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
                }
            } catch (error) {
                if (error.response.status === 401) {
                    setError('Erreur Lors de la sauvegarde de votre deck.')
                    setTimeout(() => {
                        signOut()
                        router.push('/');
                    }, 3000);
                } else {
                    setError('Erreur lors du levelUp de la carte. ' + error);
                }
            } finally {
                setAlertType('success');
                setAlertMessage('Votre deck a bien été sauvegardé.');
                setShowAlert(true);
                setTimeout(() => {
                    setShowAlert(false);
                }, 5000);
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
        console.log('deck', deck)
        // Construire une Map des cartes du joueur
        const cardMap = new Map(playerCards.map(pc => [pc.card.id, pc.card]));


        return (
            <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
                <Header points={points} />
                <div className="grid grid-cols-2 gap-4">
                    {deck.map((cardId, index) => {
                        // Récupérer la carte correspondante depuis la Map
                        const card = cardMap.get(cardId);
                        console.log(`cardId: ${cardId}, card: `, card);

                        return (
                            <div key={index}>
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
                                    className="mt-2"
                                >
                                    <option value="">Sélectionnez une carte</option>
                                    {playerCards.map((playerCard) => (
                                        <option key={playerCard.card.id} value={playerCard.card.id} disabled={deck.includes(playerCard.card.id)}>
                                            {playerCard.card.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    })}
                </div>
                {/* Bouton pour sauvegarder le deck */}
                <button
                    onClick={() => saveDeck()}
                    className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
                >
                    Sauvegarder le Deck
                </button>
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
        const response = await axios.get(`${process.env.NEXTAUTH_URL}/api/user/card`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.customJwt}`,
            }
        })
        const cards = await response.data;
        const deckInitial = cards.playerCards
            .filter(pc => pc.isInDeck)
            .map(pc => pc.card.id);

        while (deckInitial.length < 4) {
            deckInitial.push(null);
        }
        return {
            props: { cards, deckInitial },
        };
    } catch (error) {
        if (error.response.status === 401) {
            return {
                props: { errorServer: 'Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.' },
            };
        }

        return {
            props: { errorServer: error.message },
        };
    }
}
