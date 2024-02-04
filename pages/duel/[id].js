/* eslint-disable react/no-unescaped-entities */
import React, { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import axios from 'axios';
import { getServerSession } from "next-auth";
import nextAuthOptions from "../../config/nextAuthOptions";
import { useRouter } from 'next/router';
import calculatePoints from '@/utils/calculatePoints';
import Image from 'next/legacy/image';
import Header from 'C/header';
import Footer from 'C/footer';
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from '@/utils/firebaseConfig';
import axiosInstance from '@/utils/axiosInstance';
import RandomNumber from '@/components/randomNumber';

export default function Duel({ errorServer }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [error, setError] = React.useState(errorServer || null);
    const [points, setPoints] = React.useState(0);
    const { id } = router.query;
    const [loading, setLoading] = React.useState(false);
    const [duelState, setDuelState] = React.useState(null);
    const [selectedCard, setSelectedCard] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState(null);

    const handleSelectCard = (card) => {
        setSelectedCard(card);
    };

    const registerP2 = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.put(`/api/duel/${id}`, { bet: duelState.bet }, {
                customConfig: { session: session }
            });
            const data = await response.data;
            console.log(data)
            setLoading(false);
        } catch (error) {
            if (error.response?.status === 401) {
                setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
                setTimeout(() => {
                    signOut()
                    router.push('/');
                }, 2000);
            } else {
                setError(error.response?.data?.message || error.message);
            }
        }
    }
    console.log('duelState: ', duelState)

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (id) {
                const unsubscribe = onSnapshot(doc(db, "duel", id), (doc) => {
                    setDuelState(doc.data());
                    const data = doc.data();
                    if (data.statut === 'passif' && data.startTime) {
                        // Convertir le timestamp Firebase en Date JavaScript
                        const startTime = new Date(data.startTime.seconds * 1000);
                        const duration = data.duration;
                        const now = new Date();
                        
                        // Calculer le temps restant
                        const endTime = new Date(startTime.getTime() + duration * 1000);
                        const timeLeft = Math.max(endTime - now, 0) / 1000; // Convertir en secondes
                        
                        // Mettre à jour le temps restant toutes les secondes
                        const interval = setInterval(() => {
                            const nowUpdate = new Date();
                            const timeLeftUpdate = Math.max(endTime - nowUpdate, 0) / 1000;
                            setTimeLeft(timeLeftUpdate);
                            
                            if (timeLeftUpdate <= 0) {
                                clearInterval(interval);
                                // Ici, vous pouvez gérer la fin du timer
                            }
                        }, 1000);
                    }
                });
                return () => unsubscribe();
            }
        }
    }, [id]);

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
            <div className="flex flex-col h-screen">
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
            <div className="flex flex-col h-screen">
                <Header points={points} />
                <div className="flex-grow flex justify-center items-center">
                    <span className="text-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="#1f2937" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" /></path></svg></span>
                </div>
                <Footer />
            </div>
        )
    }

    if (session && duelState) {
        if (duelState.player1Id && !duelState.player2Id) {
            if (session.user.id === duelState.player1Id) {
                return (
                    <div className="flex flex-col h-screen">
                        <Header points={points} />
                        <div className="flex-grow flex justify-center items-center">
                            <span className="text-center">En attente d'un autre joueur</span>
                        </div>
                        <Footer />
                    </div>
                );
            } else {
                return (
                    <div className="flex flex-col h-screen" >
                        <Header points={points} />
                        <div className="flex-grow flex flex-col justify-center items-center">
                            <span className="mb-4 text-center">Voulez vous accepter de relever le duel de <b>{duelState.player1Name}</b> en misant <b>{duelState.bet} OC</b> ?</span>
                            <span><button className='bg-green-500 py-2 px-4 rounded mr-4' onClick={registerP2} disabled={points < duelState.bet}>Accepter</button><button className='bg-red-500 py-2 px-4 rounded'>Refuser</button></span>
                        </div>
                        <Footer />
                    </div>
                );
            }
        }
        if (duelState.player1Id && duelState.player2Id) {
            const isPlayerOne = session.user.id === duelState.player1Id;
            if (session.user.id === duelState.player1Id || session.user.id === duelState.player2Id) {
                if (duelState.statut === 'passif') {
                    return (
                        <div className="flex flex-col h-screen">
                            <Header points={points} />
                            <div className="flex-grow flex justify-center items-center">
                            <span className="text-center">Time: {timeLeft ? `${Math.floor(timeLeft)}s` : "Loading timer..."}</span>
                            </div>
                            <Footer />
                        </div>
                    );
                } else {
                return (

                    <div className="flex flex-col h-screen">
                        <Header points={points} />
                        <div className="flex flex-col flex-grow relative">

                            {/* Cartes de l'adversaire en haut */}
                            <div className="flex justify-center gap-2 md:gap-4 mt-4 absolute top-20 left-1/2 transform -translate-x-1/2">
                                {(isPlayerOne ? duelState.deckP2 : duelState.deckP1).map((card, index) => (
                                    <div key={index} className="w-24 h-32 bg-gray-400 transform hover:scale-110 transition duration-300 w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] md:w-[200px] md:h-[200px] xl:w-[250px] xl:h-[250px]">
                                        <Image src={`${card.card.picture_back}.png`} alt="Carte de dos" layout="fill"
                                            objectFit="fill"
                                            sizes="100%"
                                            priority={true} />
                                    </div>
                                ))}
                            </div>
                            <div style={{ height: '100vh', width: '100vw' }}>
                                <RandomNumber />
                            </div>
                            {/* Informations du duel au centre */}
                            {selectedCard && (
                                <div className="flex flex-col items-center gap-5 m-5 absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2">
                                    <Image src={`${selectedCard.card.picture}.png`} alt={selectedCard.card.name} className="w-40 h-56 object-cover border-2 border-green-500" />
                                    <button onClick={validateCard} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Valider cette carte</button>
                                </div>
                            )}

                            {/* Cartes du joueur en bas */}
                            <div className="flex justify-center gap-2 md:gap-4 mb-4 absolute bottom-0 left-1/2 transform -translate-x-1/2">
                                {(isPlayerOne ? duelState.deckP1 : duelState.deckP2).map((card, index) => (
                                    <div key={index} className="relative cursor-pointer duel-card w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] md:w-[200px] md:h-[200px] xl:w-[250px] xl:h-[250px]" onClick={() => handleSelectCard(card)}>
                                        <Image src={`${card.card.picture}.png`} alt={card.card.name} layout="fill"
                                            objectFit="fill"
                                            sizes="100%"
                                            priority={true} />
                                    </div>
                                ))}
                            </div>

                        </div>
                        <Footer />
                    </div>
                )
                                }
            } else {
                return (
                    <div className="flex flex-col h-screen">
                        <Header points={points} />
                        <div className="flex-grow flex justify-center items-center">
                            <span className="text-center">Ce duel est plein</span>
                        </div>
                        <Footer />
                    </div>
                );
            }
        }
    }
}

// export async function getServerSideProps(context) {
//     const { id } = context.params;

//     const session = await getServerSession(
//         context?.req,
//         context?.res,
//         nextAuthOptions
//     );

//     if (!session) {
//         return {
//             props: { errorServer: 'Session expirée reconnectez-vous' },
//         };
//     }

//     try {
//         const duelRef = doc(db, "duels", id);
//         const duelSnap = await getDoc(duelRef);

//         if (duelSnap.exists()) {
//             const duelInfo = duelSnap.data();
//             return {
//                 props: { duelInfo },
//             };
//         } else {
//             // Handle the case where the duel does not exist
//             return {
//                 props: { errorServer: 'Duel non trouvé' },
//             };
//         }
//     } catch (error) {
//         // Handle general errors
//         return {
//             props: { errorServer: error.message || 'Erreur inconnue' },
//         };
//     }
// }
