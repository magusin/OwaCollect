import React from "react";
import Image from 'next/legacy/image';
import axios from 'axios'
import calculatePoints from '@/utils/calculatePoints';
import { signOut, useSession } from 'next-auth/react';
import { useEffect } from "react";
import { useRouter } from 'next/router';
import Header from 'C/header';
import { getServerSession } from "next-auth";
import nextAuthOptions from "../../config/nextAuthOptions";


export default function Collection({ cards, errorServer }) {
    const [error, setError] = React.useState(errorServer || null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [points, setPoints] = React.useState(0);
    const [selectedCard, setSelectedCard] = React.useState(null);

    const selectedCardIndex = cards?.cards.findIndex(card => card.id === selectedCard?.id);
    // Gestionnaire de clic pour sélectionner une carte
    const handleCardClick = (card) => {
        setSelectedCard(card);
    };

    const nextCard = () => {
        const prevCard = cards.cards[(selectedCardIndex  + 1) % cards.cards.length];
        setSelectedCard(prevCard)
    };

    const previousCard = () => {
        const prevCard = cards.cards[selectedCardIndex === 0 ? cards.cards.length - 1 : selectedCardIndex - 1];
        setSelectedCard(prevCard)
    };

    // Pour fermer la vue agrandie
    const closeEnlargeView = () => {
        setSelectedCard(null);
    };

    useEffect(() => {

        if (error === 'Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.') {
            setTimeout(() => {
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

    if (status === "loading") {
        return (
            <div className="flex flex-col h-screen">
                <Header points={points} />
                <div className="flex-grow flex justify-center items-center">
                    <span className="text-center">Chargement ...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col h-screen">
                <Header points={points} />
                <div className="flex-grow flex justify-center items-center">
                    <span className="text-center text-red-500">⚠ {error}</span>
                </div>
            </div>
        );
    }

    if (session) {
        const ownedCardIds = new Set(cards.playerCards.map(card => card.cardId));
        // Créer un objet pour le suivi du count pour chaque cardId
        const cardCounts = cards.playerCards.reduce((acc, card) => {
            acc[card.cardId] = card.count;
            return acc;
        }, {});
        console.log(selectedCard)
        return (
            <div className="flex flex-col h-screen">
                <Header points={points} />
                <div className="flex-grow flex flex-col items-center">
                    <div className="flex flex-wrap justify-center">
                        {cards.cards.map((card) => (

                            <div key={card.id} onClick={() => handleCardClick(card)} className="relative flex flex-col items-center justify-center m-4 cursor-pointer">
                                <div className="relative w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] md:w-[200px] md:h-[200px] lg:w-[250px] lg:h-[250px] xl:w-[300px] xl:h-[300px] 2xl:w-[350px] 2xl:h-[350px]">
                                    <Image
                                        priority={true}
                                        src={ownedCardIds.has(card.id) ? `${card.picture}.png` : `${card.picture_back}.png`}
                                        alt={ownedCardIds.has(card.id) ? card.name : 'Dos de la carte ' + card.id}
                                        layout="fill"
                                        objectFit="contain"
                                        sizes="100%"
                                    />
                                </div>
                                <div className={`absolute inset-0 flex items-center justify-center rounded-full ${ownedCardIds.has(card.id) ? "hidden" : ""}`}>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 text-lg font-semibold shadow-xl border border-gray-300">
                                        {card.id}
                                    </div>
                                </div>
                                {cardCounts[card.id] > 1 && (
                                    <div className="absolute bottom-2 right-2 bg-red-600 text-white rounded-full px-2 py-1 text-sm font-bold">
                                        X {cardCounts[card.id]}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {selectedCard && (
                        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto h-full w-full">
                            <div className="flex flex-wrap flex-row space-x-0 p-4 h-full w-full items-center justify-center">
                                <button className="w-full md:w-auto">
                                    <Image onClick={previousCard} src="/images/previous.png" alt="previous card" objectFit="contain" objectPosition="center" width={130} height={100} />
                                </button>
                                <div className="relative h-full" style={{ width: '100%', maxWidth: '100vh' }}>
                                    <div className="aspect-w-1 aspect-h-1 h-auto">
                                        <Image
                                            priority={true}
                                            src={ownedCardIds.has(selectedCard.id) ? `${selectedCard.picture}.png` : `${selectedCard.picture_back}.png`}
                                            alt={ownedCardIds.has(selectedCard.id) ? selectedCard.name : 'Dos de la carte ' + selectedCard.id}
                                            layout="fill"
                                            objectFit="contain"
                                            sizes="100%"
                                        />
                                    </div>
                                </div>
                                <button className="w-full md:w-auto">
                                    <Image onClick={nextCard} src="/images/next.png" alt="next card" objectFit="contain" objectPosition="center" width={130} height={100} />
                                </button>
                                {ownedCardIds.has(selectedCard.id) && (cardCounts[selectedCard.id] > 2) && (points >= selectedCard.evolveCost) && (
                                    <button className="md:absolute md:bottom-0 border border-yellow-500">
                                    <Image src="/images/levelUp.png" alt="next card" objectFit="contain" objectPosition="center" width={120} height={120} />
                                </button>
                                )}
                                <button onClick={closeEnlargeView} className="w-full md:w-auto bg-red-500 text-white py-2 px-4 rounded mt-4 md:mt-0 md:absolute md:top-2 md:right-2">
                                    Fermer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
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
        return {
            props: { cards },
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
