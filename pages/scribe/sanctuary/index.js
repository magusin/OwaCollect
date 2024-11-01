/* eslint-disable react/no-unescaped-entities */
import React from "react";
import { useEffect } from "react";
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Header from 'C/header';
import Image from 'next/legacy/image';
import calculatePoints from "@/utils/calculatePoints";
import Footer from "C/footer";
import axiosInstance from "@/utils/axiosInstance";
import Head from 'next/head';
import { getSession } from "next-auth/react";
import axios from 'axios';


export default function Scribe({ secretsPlayerData, errorServer }) {
    const [error, setError] = React.useState(errorServer || null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [points, setPoints] = React.useState(0);

    // Empêcher l'accès si le joueur n'a pas le secretId === 18
    const hasSecretId18 = secretsPlayerData?.some(secret => secret.secretId === 18);
    if (!hasSecretId18) {
        router.push('/');
    }

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
                    const response = await axiosInstance.get('/api/user', {
                        customConfig: { session: session }
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
                        setError(error.response?.data?.message || error.message);
                    }
                }
            };
            getUser();
        }
    }, [status, session]);

    function HeadView() {
        return (
            <Head>
                <title>Owarida Collect | Sanctuaire</title>
                <meta name="description" content="Les mystères du sanctuaire." />
                <meta name="keywords" content="Owarida, owarida collect, scribe, owarida carte, sanctuary" />
                <link rel="icon" href="/favicon.ico" />
                <link href="https://fonts.googleapis.com/css2?family=Style+Script&display=swap" rel="stylesheet"></link>
                <link href="https://fonts.googleapis.com/css2?family=Road+Rage&display=swap" rel="stylesheet"></link>
            </Head>
        )
    }

    if (error) {
        return (
            <>
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

    if (session) {
        return (
            <>
                <HeadView />
                <Header points={points} />
                {/* Image de fond d'écran avec texte "Coming Soon" */}
                <div className="relative w-full h-screen flex items-center justify-center"
                     style={{
                         backgroundImage: `url('/images/sanctuaire.webp')`,
                         backgroundSize: 'cover',
                         backgroundPosition: 'center',
                         backgroundRepeat: 'no-repeat'
                     }}>
                    <h1 className="text-white text-6xl font-bold text-center"
                        style={{ textShadow: "2px 2px 10px rgba(0, 0, 0, 0.8)" }}>
                        Coming Soon
                    </h1>
                </div>
                <Footer />
            </>
        )
    }

}

export async function getServerSideProps(context) {

    const session = await getSession(context);

    if (!session) {
        return {
            props: { errorServer: 'Session expirée reconnectez-vous' },
        }
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
        const secretsPlayer = await axios.get(`${process.env.NEXTAUTH_URL}/api/user/secret`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.customJwt}`,
                cookie: context.req.headers.cookie,
                'x-timestamp': timestamp,
                'x-signature': signature.data.signature
            }
        })
        const secretsPlayerData = await secretsPlayer.data
        return {
            props: { secretsPlayerData },
        }
    } catch (error) {
        if (error.response?.status === 401) {
            return {
                props: { errorServer: 'Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.' },
            }
        } else {
            return {
                props: { errorServer: error.response?.data?.message || error.message },
            }
        }
    }
}