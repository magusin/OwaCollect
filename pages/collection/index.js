import React from "react";
import Image from 'next/image';
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
    console.log(cards)
    useEffect(() => {

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

    }, [status]);

    if (error) {
        {
            error === 'Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.' && setTimeout(() => {
                signOut()
                router.push('/');
            }, 2000)
        }
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


        return (
            <div className="flex flex-col h-screen">
                <Header points={points} />
                <div className="flex-grow flex flex-col items-center">
                    <div className="flex flex-wrap justify-center">
                        {cards.cards.map((card) => (

                            <div key={card.id} className="relative flex flex-col items-center justify-center m-4">
                                <Image
                                    priority={true}
                                    src={ownedCardIds.has(card.id) ? `${card.picture}.png` : `${card.picture_back}.png`}
                                    alt={ownedCardIds.has(card.id) ? card.name : 'Dos de la carte numéro ' + card.id}
                                    layout="responsive"
                                    width={350}
                                    height={350}
                                    sizes="(max-width: 768px) 200px, (max-width: 1200px) 250px, (max-width: 1599px) 300px, 350px"
                                />
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
