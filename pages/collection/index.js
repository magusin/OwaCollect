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
import Alert from "C/alert";
import Footer from "@/components/footer";
import Switch from "@/components/filterToggleSVG";
import axiosInstance from "@/utils/axiosInstance";
import Head from 'next/head';

export default function Collection({ cards, totalPoints, errorServer }) {

    const [error, setError] = React.useState(errorServer || null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [points, setPoints] = React.useState(totalPoints || 0);
    const [selectedCard, setSelectedCard] = React.useState(null);
    const [showModal, setShowModal] = React.useState(false);
    const [showModalSell, setShowModalSell] = React.useState(false);
    const [showAlert, setShowAlert] = React.useState(false);
    const [alertMessage, setAlertMessage] = React.useState('');
    const [alertType, setAlertType] = React.useState(null);
    const [isFetching, setIsFetching] = React.useState(false);
    const [allCard, setAllCard] = React.useState(cards?.cards);
    const [playerCards, setPlayerCards] = React.useState(cards?.playerCards);
    const [selectedRarity, setSelectedRarity] = React.useState('Toutes');
    const [showOwnedOnly, setShowOwnedOnly] = React.useState(false);
    const [showLevelUpOnly, setShowLevelUpOnly] = React.useState(false);
    const [filteredCards, setFilteredCards] = React.useState(allCard);
    const [filterState, setFilterState] = React.useState("none");
    const [showNewOnly, setShowNewOnly] = React.useState(false);
    const [selectedCategory, setSelectedCategory] = React.useState(
        () => {
            if (typeof localStorage !== 'undefined') {
                return localStorage.getItem('categoryOC') || null;
            } else {
                return null;
            }
        }
    );
    const ownedCardIds = new Set(playerCards?.map(card => card.cardId));
    const allCardsName = new Map(allCard?.map(card => [card.id, card]));
    const newCards = new Set(playerCards?.filter(card => card.isNew).map(card => card.cardId));
    // Créer un objet pour le suivi du count pour chaque cardId
    const cardCounts = playerCards?.reduce((acc, card) => {
        acc[card.cardId] = card.count;
        return acc;
    }, {});

    const handleSwitchChange = (position) => {
        // Logique pour modifier l'état en fonction de la position
        if (position === 30) {
            setFilterState('non possédé'); // Exemple
        } else if (position === 75) {
            setFilterState('none'); // Exemple
        } else if (position === 120) {
            setFilterState('possédé'); // Exemple
        }
    };

    // Fonction pour enlever NEW
    const removeNew = async (cardId) => {
        try {
            const response = await axiosInstance.put('/api/card/view', { cardId }, {
                customConfig: { session: session }
            });
            if (response.status === 200) {
                const data = await response.data;
                setPlayerCards(currentCards =>
                    currentCards.map(card =>
                        card.cardId === cardId ? { ...card, isNew: false } : card
                    )
                );
            }
        } catch (error) {
            if (error.response.status === 401) {
                setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
                setTimeout(() => {
                    signOut()
                    router.push('/');
                }, 3000);
            } else {
                setError('Erreur lors de la mise à jour de la carte. ' + error.response?.data?.message || error.message);
            }
        }
    }

    // Fonction pour vendre
    const handleConfirmSell = async (selectedCard, quantity) => {
        setLoading(true);
        setShowModalSell(false);
        const costPerCard = selectedCard.rarety === 'Rare' ? 70 : selectedCard.rarety === 'Epique' ? 150 : 30;
        const amount = costPerCard * quantity;

        try {
            const response = await axiosInstance.put('/api/user/card/sell', { id: selectedCard.id, quantity: quantity, amount: amount }, {
                customConfig: { session: session }
            });

            if (response.status === 200) {
                const data = await response.data;
                localStorage.setItem('userOC', JSON.stringify(data.userData));
                const totalPoints = calculatePoints(data.userData);
                localStorage.setItem('points', totalPoints);
                setPoints(totalPoints);
                setPlayerCards(data.allPlayerCards);
                setAlertType('success');
                setAlertMessage(
                    <>
                        Vous avez vendu pour <b>{amount} OC</b>
                    </>
                );
                setShowAlert(true);
                setTimeout(() => {
                    setShowAlert(false);
                }, 5000);
            }
        } catch (error) {
            if (error.response.status === 401) {
                setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
                setTimeout(() => {
                    signOut()
                    router.push('/');
                }, 3000);
            } else {
                setError('Erreur lors de la vente. ' + error.response?.data?.message || error.message);
            }
        } finally {
            setLoading(false);
        }
    }

    // Mettre à jour les cartes filtrées lorsque le filtre change
    useEffect(() => {
        let newFilteredCards = allCard?.filter(card => {
            const cardOwned = ownedCardIds.has(card.id);
            const isNew = newCards.has(card.id);
            const canLevelUp = cardCounts[card.id] >= 3 && points >= card.evolveCost && card.evolveCost !== null && !ownedCardIds.has(card.id + 1);
            const isCorrectRarity = selectedRarity === 'Toutes' || card.rarety === selectedRarity;
            const category = card.category === selectedCategory;
            // Logique de filtrage basée sur la position du switch
            if (showNewOnly && !isNew) return false;
            if (filterState === 'non possédé' && cardOwned) return false; // Si le switch est à gauche, exclure les cartes possédées
            if (filterState === 'possédé' && !cardOwned) return false; // Si le switch est à droite, exclure les cartes non possédées
            if (showOwnedOnly && !cardOwned) return false;
            if (showLevelUpOnly && !canLevelUp) return false;
            return isCorrectRarity && (category);
        });
        setFilteredCards(newFilteredCards);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showOwnedOnly, allCard, selectedRarity, showLevelUpOnly, selectedCard, filterState, selectedCategory, showNewOnly]);

    // fonction de level up de la carte
    const handleConfirmLevelUp = async (selectedCard) => {
        setLoading(true);
        setShowModal(false);
        if (points >= selectedCard.evolveCost) {
            try {
                const response = await axiosInstance.put('/api/user/card', { id: selectedCard.id, cost: selectedCard.evolveCost }, {
                    customConfig: { session: session }
                });
                if (response.status === 200) {
                    const data = await response.data;
                    localStorage.setItem('userOC', JSON.stringify(data.userData));
                    const totalPoints = calculatePoints(data.userData);
                    localStorage.setItem('points', totalPoints);
                    setPoints(totalPoints);
                    setPlayerCards(data.allPlayerCards);
                    setAlertType('success');
                    const newCard = allCard.find(card => card.id === data.updatedCard.cardId);
                    setFilteredCards(filteredCards => {
                        const isCardIncluded = filteredCards.some(card => card.id === data.updatedCard.cardId);
                        if (!isCardIncluded) {
                            return [...filteredCards, newCard]
                        }
                        return filteredCards;
                    })
                    setSelectedCard(newCard)
                    setAlertMessage(
                        <>
                            Vous avez level Up la carte <b>{selectedCard.name}</b>
                        </>
                    );
                    setShowAlert(true);
                    setTimeout(() => {
                        setShowAlert(false);
                    }, 5000);
                }
            } catch (error) {
                if (error.response.status === 401) {
                    setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
                    setTimeout(() => {
                        signOut()
                        router.push('/');
                    }, 3000);
                } else {
                    setError('Erreur lors du levelUp de la carte. ' + error.response?.data?.message || error.message);
                }
            } finally {
                setLoading(false);
            }
        } else {
            setAlertType('error');
            setAlertMessage('Vous n\'avez pas assez de points pour effectuer cette action')
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 5000);
            setLoading(false);
        };
    }

    const handleLevelUp = () => {
        setShowModal(true);
    };

    const handleSell = () => {
        setShowModalSell(true);
    };

    // Fonction pour mettre à jour la rareté sélectionnée
    const handleRarityChange = (rarity) => {
        setSelectedRarity(rarity);
    };

    const handleCategoryChange = (category) => {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('categoryOC', category);
        }
        setSelectedCategory(category);
    };

    const selectedCardIndex = filteredCards?.findIndex(card => card.id === selectedCard?.id);
    // Gestionnaire de clic pour sélectionner une carte
    const handleCardClick = (card) => {
        setSelectedCard(card);
        if (newCards.has(card.id)) {
            removeNew(card.id);
        }
    };

    // Fonction pour gérer le changement de filtre
    const handleShowLevelUpOnlyChange = (event) => {
        setShowLevelUpOnly(event.target.checked);
    };

    const handleShowNewOnlyChange = (event) => {
        setShowNewOnly(event.target.checked);
    };

    const nextCard = () => {
        const prevCard = filteredCards[(selectedCardIndex + 1) % filteredCards.length];
        setSelectedCard(prevCard)
        if (newCards.has(prevCard.id)) {
            removeNew(prevCard.id);
        }
    };

    const previousCard = () => {
        const prevCard = filteredCards[selectedCardIndex === 0 ? filteredCards.length - 1 : selectedCardIndex - 1];
        setSelectedCard(prevCard)
        if (newCards.has(prevCard.id)) {
            removeNew(prevCard.id);
        }
    };

    // Pour fermer la vue agrandie
    const closeEnlargeView = () => {
        setSelectedCard(null);
    };

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

    function HeadView() {
        return (
            <Head>
                <title>Collection | Owarida</title>
                <meta name="description" content="Collection de cartes Owarida" />
                <link rel="icon" href="/favicon.ico" />
                <meta name="keyworlds" content="Owarida, collection, cartes, Owarida Coins, points, elden ring, owarida collect, owacollect" />
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
                    <Footer />
                </div>
            </>
        );
    }

    if (status === "loading" || loading) {
        return (
            <>
                <HeadView />
                <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
                    <Header points={points} />
                    <div className="flex-grow flex justify-center items-center">
                        <span className="text-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="#1f2937" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" /></path></svg></span>
                    </div>
                    <Footer />
                </div>
            </>
        )
    }

    if (session) {
        return (
            <>
                <HeadView />
                <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
                    <Header points={points} />
                    <div className="flex-grow flex flex-col items-center">
                    <div className="cursor-pointer relative w-16 w-[200px] h-[200px] sm:w-[250px] md:w-[300px] lg:w-[350px] xl:w-[400px] 2xl:w-[450px] m-4" onClick={() => router.push('/leaderboard')} >
                                <Image
                                    src="/images/bannière-leaderboard.png"
                                    alt="Leaderboard Banner"
                                    layout="fill"
                                    objectFit="contain"
                                    sizes="100%"
                                    priority={true}
                                />
                            </div>
                        {!selectedCategory && (
                            <h1 className="flex flex-wrap justify-center font-bold text-xl m-4">
                                Sélectionnez une catégorie
                            </h1>
                        )}
                        <div className="flex flex-wrap justify-center">
                            <div className="cursor-pointer relative w-16 w-[200px] h-[100px] sm:w-[250px] md:w-[300px] lg:w-[350px] xl:w-[400px] 2xl:w-[450px] m-4" onClick={() => handleCategoryChange('Elden Ring')} >
                                <Image
                                    src="/images/elden-ring-banner.png"
                                    alt="Elden Ring Banner"
                                    layout="fill"
                                    objectFit="contain"
                                    sizes="100%"
                                    priority={true}
                                />
                            </div>
                            <div className="cursor-pointer relative w-[200px] h-[100px] sm:w-[250px]  md:w-[300px] lg:w-[350px] xl:w-[400px] 2xl:w-[450px] m-4" onClick={() => handleCategoryChange('Dark Souls')}>
                                <Image
                                    src="/images/dark-souls-banner.png"
                                    alt="Dark Souls Banner"
                                    layout="fill"
                                    objectFit="contain"
                                    sizes="100%"
                                    priority={true}
                                />
                            </div>
                        </div>
                        {selectedCategory && (
                            <div>
                                <button className="bg-green-500 hover:bg-green-700 font-bold py-2 px-4 rounded-full mx-1" onClick={() => handleRarityChange('Toutes')}>Toutes</button>
                                <button className="bg-gray-500 hover:bg-gray-700 font-bold py-2 px-4 rounded-full mx-1" onClick={() => handleRarityChange('Commune')}>Commune</button>
                                <button className="bg-blue-500 hover:bg-blue-700 font-bold py-2 px-4 rounded-full mx-1" onClick={() => handleRarityChange('Rare')}>Rare</button>
                                <button className="bg-teal-500 hover:bg-teal-700 font-bold py-2 px-4 rounded-full mx-1" onClick={() => handleRarityChange('Epique')}>Épique</button>
                                <div>
                                    <Switch onSwitchChange={handleSwitchChange} />
                                </div>
                                <div className="m-4 font-bold">
                                    <label className="m-2">
                                        <input
                                            className="mr-2 leading-tight cursor-pointer"
                                            type="checkbox"
                                            checked={showLevelUpOnly}
                                            onChange={handleShowLevelUpOnlyChange}
                                        />
                                        Level Up possible
                                    </label>
                                    <label>
                                        <input
                                            className="mr-2 leading-tight cursor-pointer"
                                            type="checkbox"
                                            checked={showNewOnly}
                                            onChange={handleShowNewOnlyChange}
                                        />
                                        Nouvelle carte
                                    </label>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center text-lg font-semibold my-4">
                            <span>{`Cartes découvertes : ${filteredCards.filter(card => ownedCardIds.has(card.id)).length
                                } / ${filteredCards.length}`}</span>
                            <span className="relative mx-4 md:mx-8 text-black bg-white rounded-full font-bold text-xl cursor-pointer group w-10 h-10 flex items-center justify-center">
                                ?
                                <span className="tooltip-text absolute hidden group-hover:block bg-gray-700 text-white text-xs rounded p-2 bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-[200px] md:w-[400px] md:text-base lg:w-[450px] 2xl:w-[500px]">
                                    <div className="flex flex-col">
                                        <span>Les <b>OC</b> s&apos;obtiennent en participant au stream d&apos;Owarida.</span>
                                        <span>Il y a trois raretés de cartes : <b>Commune</b>, <b>Rare</b> et <b>Epique</b>.</span>
                                        <span>Certaines cartes peuvent Level Up pour obtenir la carte suivante, cependant il faut 3 exemplaires + une quantité d&apos;OC pour level Up.</span>
                                    </div>
                                </span>
                            </span>
                        </div>
                        <div className="flex flex-wrap justify-center">
                            {filteredCards.map((card) => (
                                <div key={card.id} onClick={() => handleCardClick(card)} className="text-black relative flex flex-col items-center justify-center m-4 cursor-pointer">
                                    <div className="relative w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] md:w-[200px] md:h-[200px] lg:w-[250px] lg:h-[250px] xl:w-[300px] xl:h-[300px] 2xl:w-[350px] 2xl:h-[350px]">
                                        <Image
                                            priority={true}
                                            src={ownedCardIds.has(card.id) ? `${card.picture}` : `${card.picture_back}`}
                                            alt={ownedCardIds.has(card.id) ? card.name : 'Dos de la carte ' + card.id}
                                            layout="fill"
                                            objectFit="contain"
                                            sizes="100%"
                                        />
                                    </div>
                                    <div className={`absolute inset-0 flex items-center justify-center rounded-full ${ownedCardIds.has(card.id) ? "hidden" : ""}`}>
                                        <div className="bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 md:px-4 md:py-2 text-lg font-semibold shadow-xl border border-gray-300">
                                            {card.number}
                                        </div>
                                    </div>
                                    {newCards.has(card.id) && (
                                        <div className="absolute top-0 right-0 bg-green-500 text-orange-500 md:text-base rounded-full px-2 py-1 text-sm font-bold">
                                            NEW
                                        </div>
                                    )}
                                    {cardCounts[card.id] > 1 && (
                                        <div className="absolute bottom-2 right-2 bg-red-600 text-white rounded-full px-2 py-1 text-sm font-bold">
                                            X {cardCounts[card.id]}
                                        </div>
                                    )}
                                    <span className="absolute bottom-2 left-2 text-black bg-white rounded-full font-bold text-xl cursor-pointer group w-5 h-5 flex items-center justify-center">
                                        ?
                                        <span className="tooltip-text absolute hidden group-hover:block bg-gray-700 text-white text-xs rounded p-2 -ml-5 -mb-6 bottom-12 left-6 md:text-base w-[100px] sm:w-[100px] md:w-[150px] lg:w-[200px] xl:w-[250px] 2xl:w-[300px]">
                                            {card.id === 117 || card.id === 66 || card.id === 51 || card.id === 101 || card.id === 162 ? "S'obtient via un événement"
                                                : card.isDraw === true
                                                    ? `S'obtient via la boutique ${card.evolveCost ? "et peut level Up" : ""}`
                                                    : (!allCardsName.get(card.id - 1)?.evolvedId)
                                                        ? "Vendu par un mystérieux marchand"
                                                        : `S'obtient via le level Up de ${ownedCardIds.has(card.id - 1)
                                                            ? allCardsName.get(card.id - 1)?.name
                                                            : card.number - 1
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
                                                src={ownedCardIds.has(selectedCard.id) ? `${selectedCard.picture}` : `${selectedCard.picture_back}`}
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
                                    {ownedCardIds.has(selectedCard.id) && (selectedCard.evolveCost) && (!ownedCardIds.has(selectedCard.id + 1)) && (
                                        <button onClick={handleLevelUp} disabled={!(cardCounts[selectedCard.id] > 2 && points >= selectedCard.evolveCost)} className={`w-16 md:w-24 lg:w-28 xl:w-32 absolute bottom-0 ${cardCounts[selectedCard.id] > 2 ? "border border-yellow-500" : ""}  md:bottom-0 z-10`}>
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
                                        sell={true}
                                    />
                                )}
                                {showAlert && (
                                    <Alert
                                        type={alertType}
                                        message={alertMessage}
                                        close={setShowAlert}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                    <Footer />
                </div>
            </>
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
                cookie: context.req.headers.cookie
            }
        })
        const cards = await response.data;
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
            props: { cards, totalPoints },
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
