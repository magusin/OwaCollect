import React from "react";
import { useEffect } from "react";
import axios from 'axios'
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Header from 'C/header';
import Image from 'next/legacy/image';
import calculatePoints from "@/utils/calculatePoints";
import { getSession } from "next-auth/react";
import { useDarkMode } from "@/contexts/darkModeContext";
import Alert from "C/alert";
import Modal from "C/modal";
import Footer from "C/footer";
import axiosInstance from "@/utils/axiosInstance";
import Head from "next/head";

export default function SecretShop({ cards, totalPoints, errorServer }) {
    const [error, setError] = React.useState(errorServer || null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [points, setPoints] = React.useState(totalPoints || 0);
    const [allCard, setAllCard] = React.useState(cards?.cards);
    const [playerCards, setPlayerCards] = React.useState(cards?.playerCards);
    const { id } = router.query;
    const { darkMode } = useDarkMode();
    const [alertMessage, setAlertMessage] = React.useState('');
    const [showAlert, setShowAlert] = React.useState(false);
    const [alertType, setAlertType] = React.useState(null);
    const [showModal, setShowModal] = React.useState(false);
    const [selectedCard, setSelectedCard] = React.useState(null);
    const [cardToBuy, setCardToBuy] = React.useState(null);
    const [selectedCategory, setSelectedCategory] = React.useState('Elden Ring');

    const handleBuyCard = ({card}) => {
        // Mise à jour de l'état pour la carte sélectionnée
        setCardToBuy(card);
        setShowModal(true);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    // Pour fermer la vue agrandie
    const closeEnlargeView = () => {
        setSelectedCard(null);
    };

    const handleConfirmBuyCard = async (id, cost) => {
        setLoading(true);
        setShowModal(false);
        if (points >= cost) {
            try {
                const response = await axiosInstance.put('/api/user/card/buy', {
                    id,
                    cost
                }, {
                    customConfig: { session: session }
                });
                if (response.status === 200) {
                    const data = await response.data
                    localStorage.setItem('userOC', JSON.stringify(data.userData));
                    const totalPoints = calculatePoints(data.userData);
                    localStorage.setItem('points', totalPoints);
                    setPoints(totalPoints);
                    setPlayerCards(data.allPlayerCards);
                    setAlertMessage(`Carte ${id} achetée !`);
                    setAlertType('success');
                    setShowAlert(true);
                    setTimeout(() => {
                        setShowAlert(false);
                    }, 5000);

                    let selectedCard = data.allPlayerCards.find(card => card.card.id === data.updatedCard.cardId);
                    setSelectedCard(selectedCard.card)
                }

            } catch (error) {
                if (error.response?.status === 401) {
                    setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
                    setTimeout(() => {
                        signOut()
                        router.push('/');
                    }, 3000);
                } else {
                    setError('Erreur lors de l\'achat. ' + error.response?.data?.message || error.message);
                }
            } finally {
                setLoading(false);
            }
        } else {
            setAlertMessage(`Vous n'avez pas assez de points pour acheter cette carte.`);
            setAlertType('error');
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 5000);
            setLoading(false);
        }
    }

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
                <title>Boutique secrète - Owarida</title>
                <meta name="description" content="Boutique secrète d'OWarida" />
                <meta name="keywords" content="OWarida, boutique, secrète, cartes, points" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
        );
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
        const secretShopLink = localStorage.getItem('secretShopLink');
        if (secretShopLink != null && secretShopLink === id) {
            const ownedCardIds = new Set(playerCards.map(card => card.cardId));
            // const secretCardsToBuy = [74, 99, 100].filter(number => !ownedCardIds.has(number));
            const secretCardsToBuy = [];
            if (selectedCategory === "Elden Ring") {
                const eldenRingCardsIds = [74, 99, 100];
                for (const id of eldenRingCardsIds) {
                    const card = ownedCardIds.has(id)
                    if (!card) {
                        secretCardsToBuy.push({ card: { cardId: id, number: id } });
                    }
                }
            } else if (selectedCategory === "Dark Souls") {
                const darkSoulsCardsIds = [230];
                for (const id of darkSoulsCardsIds) {
                    const card = ownedCardIds.has(id)
                    if (!card) {
                        secretCardsToBuy.push({ card: { cardId: id, number: 49 } });
                    }
                }
            }

            return (
                <>
                    <HeadView />
                    <div className="flex flex-col h-screen" >
                        <Header points={points} />
                        <div className="flex-grow mt-4 flex flex-col items-center" style={{ marginTop: "80px" }}>
                            <Image
                                src="/images/salesman.webp"
                                alt="salesman"
                                priority={true}
                                width={600}
                                height={525}
                            />
                        </div>
                        <div className="flex flex-wrap justify-center">
                            <div className={`cursor-pointer relative w-16 w-[200px] h-[100px] sm:w-[250px] md:w-[300px] lg:w-[350px] xl:w-[400px] 2xl:w-[450px] m-4 ${selectedCategory === 'Elden Ring' ? 'opacity-100' : 'opacity-50'}`} onClick={() => handleCategoryChange('Elden Ring')} >
                                <Image
                                    src="/images/elden-ring-banner.webp"
                                    alt="Elden Ring Banner"
                                    layout="fill"
                                    objectFit="contain"
                                    sizes="100%"
                                    priority={true}
                                />
                            </div>
                            <div className={`cursor-pointer relative w-[200px] h-[100px] sm:w-[250px]  md:w-[300px] lg:w-[350px] xl:w-[400px] 2xl:w-[450px] m-4 ${selectedCategory === 'Dark Souls' ? 'opacity-100' : 'opacity-50'}`} onClick={() => handleCategoryChange('Dark Souls')}>
                                <Image
                                    src="/images/dark-souls-banner.webp"
                                    alt="Dark Souls Banner"
                                    layout="fill"
                                    objectFit="contain"
                                    sizes="100%"
                                    priority={true}
                                />
                            </div>
                        </div>
                        <div className="flex-grow mt-4 flex flex-wrap justify-center">
                            {secretCardsToBuy.map(card => (
                                <div key={card.card.cardId} className={`p-4 border-2 ${darkMode ? 'border-white' : 'border-black'} rounded-lg m-2 text-center max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg`}>
                                    <h3 className="font-bold mb-4">Carte {card.card.number}</h3>
                                    <p className="mb-4">Prix: <b>500 OC</b></p>
                                    <button
                                        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
                                        onClick={() => handleBuyCard(card)}
                                    >
                                        Acheter
                                    </button>
                                    {showModal && (
                                        <Modal
                                            setShowModal={setShowModal}
                                            handleConfirm={() => handleConfirmBuyCard(cardToBuy.cardId, 500)}
                                            title="Confirmation d'achat"
                                            message={
                                                <>
                                                    {/* eslint-disable-next-line react/no-unescaped-entities */}
                                                    Êtes-vous sûr de vouloir acheter la carte {cardToBuy.number} pour <b>500 OC</b> ?
                                                </>
                                            }
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        {selectedCard && (
                            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20 px-4 py-6 overflow-y-auto h-full w-full">
                                <div className="flex flex-wrap flex-row p-4 h-full w-full items-center justify-center md:flex-col">
                                    {/* Image card */}
                                    <div className="relative h-full" style={{ width: '100%', maxWidth: '100vh' }}>
                                        <div className="aspect-w-1 aspect-h-1 ">
                                            <Image
                                                priority={true}
                                                src={`${selectedCard.picture}.png`}
                                                alt={'Dos de la carte ' + selectedCard.id}
                                                layout="fill"
                                                objectFit="contain"
                                                sizes="100%"
                                            />
                                        </div>
                                    </div>

                                    {/* Button close */}
                                    <button onClick={closeEnlargeView} className="w-full sm:w-auto bg-red-500 text-white py-2 px-4 rounded mt-4 sm:mt-0 sm:absolute sm:top-2 sm:right-2">
                                        Fermer
                                    </button>
                                </div>
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
                </>
            );
        } else {
            return (
                <>
                    <HeadView />
                    <div className="flex flex-col h-screen">
                        <Header points={points} />
                        <div className="flex-grow items-start justify-center" >
                            <div className="relative w-full h-screen">
                                <button className='absolute z-20 right-5 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-50 md:text-xl text-white font-bold py-2 px-4 rounded-full'
                                    onClick={() => router.push('/scribe')}>Scribe</button>
                                <Image
                                    src="/images/closed.png"
                                    alt="Fond"
                                    layout="fill"
                                    objectFit="cover"
                                    objectPosition={"center"}
                                    priority={true}
                                />
                            </div>
                        </div>
                        <Footer />
                    </div>
                </>
            );
        }
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
        if (error.response && error.response.status === 401) {
            return {
                props: { errorServer: 'Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.' },
            };
        }

        return {
            props: { errorServer: error.message },
        };
    }
}