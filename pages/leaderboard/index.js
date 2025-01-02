import React from "react";
import { useEffect } from "react";
import { signOut, useSession } from 'next-auth/react';
import axios from 'axios'
import { useRouter } from 'next/router';
import Header from 'C/header';
import Image from 'next/legacy/image';
import calculatePoints from "@/utils/calculatePoints";
import { getSession } from "next-auth/react";
import { useDarkMode } from "@/contexts/darkModeContext";
import Footer from "C/footer";
import Head from 'next/head';

export default function Leaderboard({ totalPoints, errorServer, leaderboard }) {
    const [error, setError] = React.useState(errorServer || null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [points, setPoints] = React.useState(totalPoints || 0);
    const [showInput, setShowInput] = React.useState(false);
    const inputRef = React.useRef(null);
    const [code, setCode] = React.useState('');
    const [message, setMessage] = React.useState('');
    const { darkMode } = useDarkMode();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [displayedLeaderboard, setDisplayedLeaderboard] = React.useState([]);

    useEffect(() => {
        let rank = 1;
        let prevCardCount = null;
        const initialRankedLeaderboard = leaderboard.map((player, index) => {
            if (index === 0 || player.cardCount !== prevCardCount) {
                rank = index + 1; // Commencez le rang à 1 et ajustez seulement si le nombre de cartes change
            }
            prevCardCount = player.cardCount; // Mettez à jour le précédent nombre de cartes pour la prochaine itération
            return {
                ...player,
                rank, // Utilisez le rang ajusté
            };
        });

        // Ajustement pour les résultats de recherche pour maintenir le classement original
        if (!searchTerm) {
            setDisplayedLeaderboard(initialRankedLeaderboard.slice(0, 100)); // Affiche les 100 premiers
        } else {
            const searchResults = leaderboard
                .filter(player => player.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(player => ({
                    ...player,
                    rank: initialRankedLeaderboard.find(p => p.petId === player.petId).rank // Trouve le rang initial basé sur petId
                }));

            setDisplayedLeaderboard(searchResults);
        }
    }, [searchTerm, leaderboard]);

    useEffect(() => {

        localStorage.setItem('points', points);

        if (status === 'unauthenticated') {
            router.push('/');
        }

        if (localStorage.getItem('points') != null) {
            setPoints(localStorage.getItem('points'))
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
    }, [status, session, error, router, points]);

    const getAvatarImage = (index) => {
        if (index >= 0 && index < 10) {
            return `/images/avatar${index + 1}.webp`;
        } else if (index >= 10 && index < 20) {
            return `/images/avatar11.webp`;
        } else if (index >= 20 && index < 50) {
            return `/images/avatar12.webp`;
        } else if (index >= 50 && index < 100) {
            return `/images/avatar13.webp`;
        } else {
            return `/images/avatar14.webp`;
        }
    };

    const HeadView = () => {
        return (
            <Head>
                <title>Owarida - Leaderboard</title>
                <meta name="description" content="Leaderboard de la OwaCollect" />
                <meta name="keywords" content="Owarida, Stream, Twitch, streameur, chaine" />
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
        return (
            <>
                <Header points={points} />
                <div className="container mx-auto flex flex-col items-center p-4" style={{ marginTop: "80px" }}>
                    <input
                        className="border p-2 rounded mb-4 text-black"
                        placeholder="Recherche par nom..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {displayedLeaderboard.length > 0 ? (
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayedLeaderboard.map((player, index) => (
                                <div key={index} className={`flex flex-col items-center p-4 ${darkMode ? 'bg-gray-700' : 'bg-white'} gray rounded-lg shadow`}>
                                    <div className="flex items-center justify-center relative">
                                        <div className="flex absolute left-0 justify-center items-center" style={{ height: '200px', width: '50px', marginLeft: '-60px' }}>
                                            <span className="font-bold text-xl">#{player.rank}</span>
                                        </div>
                                        <div className="relative justify-center items-center" style={{ height: '200px', width: '200px' }}>
                                            <div className="absolute z-0">
                                                <Image src={getAvatarImage(player.rank -1)} alt="Avatar Border" width={200} height={200} loading="lazy" />
                                            </div>
                                            <div className="z-10" style={{ paddingTop: "50px", marginLeft: "50px" }}>
                                                <Image src={player.imageUrl} alt={player.name} width={100} height={100} className="rounded-full" loading="lazy" />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-2 font-semibold">{player.name}</p>
                                    <p className="">{player.cardCount} cartes</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center">Aucun joueur trouvé.</p>
                    )}
                </div>
                <Footer />
            </>
        );
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

        const leaderboardCall = await axios.get(`${process.env.NEXTAUTH_URL}/api/user/card/leaderboard`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.customJwt}`,
                cookie: context.req.headers.cookie,
                'x-timestamp': timestamp,
                'x-signature': signature.data.signature
            }
        })
        const leaderboard = await leaderboardCall.data;

        return {
            props: { totalPoints, leaderboard },
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