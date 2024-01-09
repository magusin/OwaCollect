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

export default function SecretShop({ cards, errorServer }) {
    const [error, setError] = React.useState(errorServer || null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [points, setPoints] = React.useState(0);
    const [allCard, setAllCard] = React.useState(cards?.cards);
    const [playerCards, setPlayerCards] = React.useState(cards?.playerCards);
    const { id } = router.query;
    const { darkMode } = useDarkMode();
    const [alertMessage, setAlertMessage] = React.useState('');
    const [showAlert, setShowAlert] = React.useState(false);
    const [alertType, setAlertType] = React.useState(null);
    const [showModal, setShowModal] = React.useState(false);

    const handleBuyCard = () => {
        setShowModal(true);
    }

    const handleConfirmBuyCard = async (id, cost) => {
        setLoading(true);
        setShowModal(false);
        if (points >= cost) {

            try {
                const response = await axios.put('/api/user/card/buy', { id, cost }, {
                    headers: {
                        Authorization: `Bearer ${session.customJwt}`,
                        'Content-Type': 'application/json'
                    },
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
                }

            } catch (error) {
                if (error.response.status === 401) {
                    setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
                    setTimeout(() => {
                        signOut()
                        router.push('/');
                    }, 3000);
                } else {
                    setError('Erreur lors de l\'achat. ' + error);
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
            </div>
        )
    }

    if (session) {
        const secretShopLink = localStorage.getItem('secretShopLink');
        if (secretShopLink != null && secretShopLink === id) {
            const ownedCardIds = new Set(playerCards.map(card => card.cardId));
            const secretCardsToBuy = [74, 99, 100].filter(id => !ownedCardIds.has(id));
            return (
                <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
                    <Header points={points} />
                    <div className="mt-4 flex flex-col items-center">
                        <Image
                            src="/images/salesman.png"
                            alt="salesman"
                            priority={true}
                            width={600}
                            height={525}
                        />
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center">
                        {secretCardsToBuy.map(cardId => (
                            <div key={cardId} className={`p-4 border-2 ${darkMode ? 'border-white' : 'border-black'} rounded-lg m-2 text-center max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg`}>
                                <h3 className="font-bold mb-4">Carte {cardId}</h3>
                                <p className="mb-4">Prix: 2500 <b>OC</b></p>
                                <button
                                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
                                    onClick={() => handleBuyCard()}
                                >
                                    Acheter
                                </button>
                                {showModal && (
                                    <Modal
                                        setShowModal={setShowModal}
                                        handleConfirm={() => handleConfirmBuyCard(cardId, 2500)}
                                        title="Confirmation d'achat"
                                        message={
                                            <>
                                                {/* eslint-disable-next-line react/no-unescaped-entities */}
                                                Êtes-vous sûr de vouloir acheter la carte {cardId} pour 2500 <b>OC</b> ?
                                            </>
                                        }
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    {showAlert && (
                        <Alert
                            type={alertType}
                            message={alertMessage}
                            close={setShowAlert}
                        />
                    )}
                </div>
            );
        } else {
            return (
                <div className="flex flex-col h-screen">
                    <Header points={points} />
                    <div className="flex-grow flex items-start justify-center" >
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
                </div>
            );
        }
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