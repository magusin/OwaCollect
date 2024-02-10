import React from "react";
import { useEffect } from "react";
import axios from 'axios'
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Header from 'C/header';
import Image from 'next/legacy/image';
import calculatePoints from "@/utils/calculatePoints";
import { getServerSession } from "next-auth";
import nextAuthOptions from "../../config/nextAuthOptions";
import { useDarkMode } from "@/contexts/darkModeContext";
import Alert from "C/alert";
import Modal from "C/modal";
import Footer from "C/footer";
import axiosInstance from "@/utils/axiosInstance";

export default function Blacksmith({ cards, totalPoints, errorServer }) {
    const [error, setError] = React.useState(errorServer || null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [points, setPoints] = React.useState(totalPoints || 0);
    const [allCard, setAllCard] = React.useState(cards?.cards);
    const [playerCards, setPlayerCards] = React.useState(cards?.playerCards);
    const { darkMode } = useDarkMode();
    const [alertMessage, setAlertMessage] = React.useState('');
    const [showAlert, setShowAlert] = React.useState(false);
    const [alertType, setAlertType] = React.useState(null);
    const [showModal, setShowModal] = React.useState(false);
    const [selectedCard, setSelectedCard] = React.useState(null);
    const [cardToForge, setCardToForge] = React.useState(null);

    const handleForgeCard = (card) => {
        // Afficher modal
        setCardToForge(card);
        setShowModal(true);
    };

    // Pour fermer la vue agrandie
    const closeEnlargeView = () => {
        setSelectedCard(null);
    };

    const handleConfirmForgeCard = async (id) => {
        setLoading(true);
        setShowModal(false);
            try {
                const response = await axiosInstance.put('/api/user/card/forge', {
                    id
                }, {
                    customConfig: { session: session }
                });
                if (response.status === 200) {
                    const data = await response.data
                    let selectedCard = data.updatedCard;
                    setPlayerCards(data.allPlayerCards);
                    setAlertMessage(`Carte ${selectedCard.name} obtenue !`);
                    setAlertType('success');
                    setShowAlert(true);
                    setTimeout(() => {
                        setShowAlert(false);
                    }, 5000);

                    setSelectedCard(selectedCard)
                }

            } catch (error) {
                if (error.response?.status === 401) {
                    setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
                    setTimeout(() => {
                        signOut()
                        router.push('/');
                    }, 3000);
                } else {
                    setError('Erreur lors de la forge. ' + error.response?.data?.message || error.message);
                }
            } finally {
                setLoading(false);
            }
    }

    useEffect(() => {
        if (localStorage.getItem('points') != null) {
            localStorage.setItem('points', points);
        }
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

    if (status === "loading" || loading) {
        return (
            <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
                <Header points={points} />
                <div className="flex-grow flex justify-center items-center">
                    <span className="text-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="#1f2937" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" /></path></svg></span>
                </div>
                <Footer />
            </div>
        )
    }

    if (session) {

        const ownedCardIds = new Set(playerCards.map(card => card.cardId));
        return (
            <>
                <div className="flex flex-col h-screen" >
                    <Header points={points} />
                    <div className="flex-grow mt-4 flex flex-col items-center" style={{ marginTop: "80px" }}>
                        <Image
                            src="/images/blacksmith.png"
                            alt="blacksmith"
                            priority={true}
                            width={550}
                            height={550}
                        />
                    </div>
                    <div className="flex-grow mt-4 flex flex-wrap justify-center">
                        <div className="flex flex-col justify-center my-4">
                            <p className="text-center text-xl font-bold">Bienvenue chez le forgeron !</p>
                            <p className="text-center text-lg">Vous pouvez donner 3 cartes identiques au forgeron et il vous fabriquera une autre carte de même collection et rareté.</p>
                            <div className="flex flex-wrap justify-center">
                                {playerCards.map((card, index) => (
                                    card.count > 3 ? (
                                        <div key={index} className="flex flex-col items-center p-4">
                                            <div className="relative w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] md:w-[200px] md:h-[200px] lg:w-[250px] lg:h-[250px] xl:w-[300px] xl:h-[300px] 2xl:w-[350px] 2xl:h-[350px]">
                                                <Image
                                                    priority={true}
                                                    src={`${card.card.picture}.png`}
                                                    alt={card.name}
                                                    layout="fill"
                                                    objectFit="contain"
                                                    sizes="100%"
                                                />
                                            <div className="absolute bottom-2 right-2 bg-red-600 text-white rounded-full px-2 py-1 text-sm font-bold">
                                        X {card.count}
                                    </div>
                                            </div>
                                            <button
                                                onClick={() => handleForgeCard(card.card)}
                                                className="bg-green-500 text-white py-2 px-4 rounded mt-4">
                                                Sacrifier
                                            </button>
                                            {showModal && (
                                                <Modal
                                                    setShowModal={setShowModal}
                                                    title="Confirmation de fabrication de carte"
                                                    message={
                                                        <>
                                                        Voulez-vous fabriquer une nouvelle carte <b>{cardToForge.rarety}</b> en sacrifiant 3 exemplaire de <b>{cardToForge.name}</b> ?
                                                        </>
                                                    }
                                                    handleConfirm={() => handleConfirmForgeCard(cardToForge.id)}
                                                />
                                            )}
                                        </div>
                                    ) : null
                                ))}
                            </div>

                        </div>
                    </div>
                    {selectedCard && (
                        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto h-full w-full">
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
                <div className="flex flex-col h-screen">
                    <Header points={points} />
                    <div className="flex-grow items-start justify-center" >
                        <div className="w-full h-screen">
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