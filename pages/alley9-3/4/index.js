import React from 'react';
import { useRouter } from 'next/router';
import { useEffect } from "react";
import Header from 'C/header';
import Footer from 'C/footer';
import Image from "next/image";
import { signOut, useSession } from 'next-auth/react';
import calculatePoints from '@/utils/calculatePoints';
import axiosInstance from '@/utils/axiosInstance';
import Head from 'next/head';

export default function Alley() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [points, setPoints] = React.useState(0);
    const [error, setError] = React.useState(null);

    // Fonction pour générer une chaîne aléatoire
    const generateRandomString = (length = 10) => {
        // Génère une chaîne de caractères aléatoires de la longueur spécifiée
        return [...Array(length)].map(() => (Math.random() * 36 | 0).toString(36)).join('');
    }

    // Gestionnaire onClick qui utilise la chaîne aléatoire pour naviguer
    const handleRandomNavigation = () => {
        const randomString = generateRandomString();
        router.push(`/secretShop/${randomString}`);
    }

    function HeadView() {
        return (
            <Head>
                <title>Allée - Owarida</title>
                <meta name="description" content="Conditions Générales d'Utilisation du site Owarida" />
                <meta name="keywords" content="owarida, owarida collect, twitch, elden ring" />
            </Head>
        )
    }

    useEffect(() => {

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

        if (status === 'unauthenticated') {
            router.push('/');
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, session]);

    return (
        <>
            <HeadView />
        <div className="flex flex-col h-screen">
            <Header points={points}/>
            <div className="relative flex-grow flex justify-center">
                <button className='absolute z-50 right-5 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-50 md:text-xl text-white font-bold py-2 px-4 rounded-full'
                    onClick={handleRandomNavigation}>Marchand</button>
                {/* Pour centrer à gauche */}
                <button className='absolute z-50 left-5 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-50 md:text-xl text-white font-bold py-2 px-4 rounded-full'
                    onClick={() => router.push('/blacksmith')}>Forgeron</button>
                <Image src="/images/alley.png" alt="Alley 9-3/4" fill priority={true} />
            </div>
            <Footer />
        </div>
        </>
    );
}