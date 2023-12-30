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
import Modal from "C/modal";

export default function Collection({ cards, errorServer }) {
    const [error, setError] = React.useState(errorServer || null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [points, setPoints] = React.useState(0);
    const [selectedCard, setSelectedCard] = React.useState(null);
    const [showModal, setShowModal] = React.useState(false);
    const [showModalSell, setShowModalSell] = React.useState(false);
    const [isFetching, setIsFetching] = React.useState(false);
    const [allCard, setAllCard] = React.useState(cards?.cards);
    const [playerCards, setPlayerCards] = React.useState(cards?.playerCards);

    // Fonction pour vendre
    const handleConfirmSell = async (selectedCard, quantity) => {
        console.log('quantity', quantity)
        setLoading(true);
        setShowModalSell(false);
        const costPerCard = selectedCard.rarety === 'Rare' ? 70 : selectedCard.rarety === 'Epique' ? 150 : 30;
        const amount = costPerCard * quantity;

        try {
            const response = await axios.put('/api/user/card/sell', { id: selectedCard.id, quantity: quantity, amount: amount }, {
                headers: {
                    Authorization: `Bearer ${session.customJwt}`,
                    'Content-Type': 'application/json'
                },
            });
            if (response.status === 200) {
                const data = await response.data;
                localStorage.setItem('userOC', JSON.stringify(data.userData));
                const totalPoints = calculatePoints(data.userData);
                localStorage.setItem('points', totalPoints);
                setPoints(totalPoints);
                setPlayerCards(data.allPlayerCards);
            }
        } catch (error) {
            if (error.response.status === 401) {
                setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
                setTimeout(() => {
                    signOut()
                    router.push('/');
                }, 3000);
            } else {
                setError('Erreur lors de la vente. ' + error);
            }
        } finally {
            setLoading(false);
        }
    }

    // fonction de level up de la carte
    const handleConfirmLevelUp = async (selectedCard) => {
        setLoading(true);
        setShowModal(false);
        if (points >= selectedCard.evolveCost) {
            try {
                const response = await axios.put('/api/user/card', { id: selectedCard.id, cost: selectedCard.evolveCost }, {
                    headers: {
                        Authorization: `Bearer ${session.customJwt}`,
                        'Content-Type': 'application/json'
                    },
                });
                if (response.status === 200) {
                    const data = await response.data;
                    localStorage.setItem('userOC', JSON.stringify(data.userData));
                    const totalPoints = calculatePoints(data.userData);
                    localStorage.setItem('points', totalPoints);
                    setPoints(totalPoints);
                    setPlayerCards(data.allPlayerCards);
                    nextCard();
                }
            } catch (error) {
                if (error.response.status === 401) {
                    setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
                    setTimeout(() => {
                        signOut()
                        router.push('/');
                    }, 3000);
                } else {
                    setError('Erreur lors du levelUp de la carte. ' + error);
                }
            } finally {
                setLoading(false);
            }
        } else {
            setError('Vous n\'avez pas assez de points pour effectuer cette action.');
        };
    }

    const handleLevelUp = () => {
        setShowModal(true);
    };

    const handleSell = () => {
        setShowModalSell(true);
    };

    const selectedCardIndex = cards?.cards.findIndex(card => card.id === selectedCard?.id);
    // Gestionnaire de clic pour sélectionner une carte
    const handleCardClick = (card) => {
        setSelectedCard(card);
    };

    const nextCard = () => {
        const prevCard = allCard[(selectedCardIndex + 1) % allCard.length];
        setSelectedCard(prevCard)
    };

    const previousCard = () => {
        const prevCard = allCard[selectedCardIndex === 0 ? allCard.length - 1 : selectedCardIndex - 1];
        setSelectedCard(prevCard)
    };

    // Pour fermer la vue agrandie
    const closeEnlargeView = () => {
        setSelectedCard(null);
    };

    console.log(cards)



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

    if (status === "loading" || loading) {
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
        const ownedCardIds = new Set(playerCards.map(card => card.cardId));

        // Créer un objet pour le suivi du count pour chaque cardId
        const cardCounts = playerCards.reduce((acc, card) => {
            acc[card.cardId] = card.count;
            return acc;
        }, {});

        return (
            <div className="flex flex-col h-screen">
                <Header points={points} />
                <div className="flex-grow flex flex-col items-center">
                    <div className="relative w-full h-16 md:h-24 hl:h-28 2xl:h-32 my-4">
                        <Image
                            src="/images/elden-ring-banner.png"
                            alt="Elden Ring Banner"
                            layout="fill"
                            objectFit="contain"
                            priority={true}
                        />
                    </div>
                    <div className="text-lg font-semibold my-4">
                        {`Cartes découvertes : ${ownedCardIds.size} / ${allCard.length}`}
                    </div>
                    <div className="flex flex-wrap justify-center">
                        {allCard.map((card) => (
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
                                <span className="absolute bottom-2 left-2 text-black bg-white rounded-full font-bold text-xl cursor-pointer group w-5 h-5 flex items-center justify-center">
                                    ?
                                    <span className="tooltip-text absolute hidden group-hover:block bg-gray-700 text-white text-xs rounded p-2 -ml-5 -mb-6 bottom-12 left-6 md:text-base w-[100px] sm:w-[100px] md:w-[150px] lg:w-[200px] xl:w-[250px] 2xl:w-[300px]">
                                        {card.isDraw === true
                                            ? "S'obtient via la boutique"
                                            : `S'obtient via le levelUp de ${ownedCardIds.has(card.id - 1)
                                                ? allCard.find(c => c.id === card.id - 1)?.name
                                                : card.id - 1
                                            }`
                                        }
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                    {selectedCard && (
                        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto h-full w-full">
                            <div className="flex flex-wrap flex-row p-4 h-full w-full items-center justify-center md:flex-col">
                                {/* Button previous card */}
                                <button className="w-20 xl:w-auto md:w-24">
                                    <Image onClick={previousCard} src="/images/previous.png" alt="previous card" objectFit="contain" objectPosition="center" width={130} height={100} />
                                </button>
                                {/* Image card */}
                                <div className="relative h-full" style={{ width: '100%', maxWidth: '100vh' }}>
                                    <div className="aspect-w-1 aspect-h-1 ">
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
                                {/* Button next card */}
                                <button className="w-20 xl:w-auto md:w-24">
                                    <Image onClick={nextCard} src="/images/next.png" alt="next card" objectFit="contain" objectPosition="center" width={130} height={100} />
                                </button>
                                {/* Button sell up */}
                                {ownedCardIds.has(selectedCard.id) && (cardCounts[selectedCard.id] > 1) && (
                                    <button onClick={handleSell} disabled={!cardCounts[selectedCard.id] > 1} className="w-20 absolute bottom-2 left-4 md:w-24 xl:w-auto">
                                        <Image src="/images/sell.png" alt="next card" objectFit="contain" objectPosition="center" width={100} height={100} />
                                    </button>
                                )}
                                {/* Button level up */}
                                {ownedCardIds.has(selectedCard.id) && (selectedCard.evolveCost) && (
                                    <button onClick={handleLevelUp} disabled={!(cardCounts[selectedCard.id] > 2 && points >= selectedCard.evolveCost)} className="w-16 md:w-24 lg:w-28 xl:w-32 absolute bottom-0 border border-yellow-500 md:bottom-0">
                                        <Image src="/images/levelUp.png" alt="next card" objectFit="contain" objectPosition="center" width={120} height={120} />
                                    </button>
                                )}
                                {/* Button close */}
                                <button onClick={closeEnlargeView} className="w-full sm:w-auto bg-red-500 text-white py-2 px-4 rounded mt-4 sm:mt-0 sm:absolute sm:top-2 sm:right-2">
                                    Fermer
                                </button>
                            </div>
                            {showModal && (
                                <Modal
                                    setShowModal={setShowModal}
                                    handleConfirm={() => handleConfirmLevelUp(selectedCard)}
                                    title="Confirmation de Level Up"
                                    message={
                                        <>
                                            Êtes-vous sûr de vouloir dépensser 2 exemplaires de <b>{selectedCard.name}</b> ainsi que <b>{selectedCard.evolveCost} OC</b> ?
                                        </>
                                    }
                                />
                            )}
                            {showModalSell && (
                                <Modal
                                    setShowModal={setShowModalSell}
                                    handleConfirm={(quantity) => handleConfirmSell(selectedCard, quantity)}
                                    title="Confirmation de vente"
                                    message={
                                        <>
                                            {/* eslint-disable-next-line react/no-unescaped-entities */}
                                            Combien d'exemplaires de <b>{selectedCard.name}</b> souhaitez-vous vendre ?
                                        </>
                                    }
                                    maxQuantity={cardCounts[selectedCard.id] - 1}
                                    cost={selectedCard.rarety === 'Rare' ? 70 : selectedCard.rarety === 'Epique' ? 150 : 30}
                                />
                            )}
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
