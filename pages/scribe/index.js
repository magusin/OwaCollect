import React from "react";
import { useEffect } from "react";
import { signOut, useSession } from 'next-auth/react';
import axios from 'axios'
import { useRouter } from 'next/router';
import Header from 'C/header';
import Image from 'next/legacy/image';
import calculatePoints from "@/utils/calculatePoints";
import { getServerSession } from "next-auth";
import nextAuthOptions from "../../config/nextAuthOptions";
import { useDarkMode } from "@/contexts/darkModeContext";
import Footer from "C/footer";
import axiosInstance from "@/utils/axiosInstance";
import Head from 'next/head';

export default function Scribe({ user }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [points, setPoints] = React.useState(0);

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

    function HeadView () {
        return (
            <Head>
                <title>Owarida Collect | Décryptez ce qu&apos;a pu dire le scribe</title>
                <meta name="description" content="Les écrits du scribe." />
                <meta name="keywords" content="Owarida, owarida collect, scribe, owarida carte" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
        )
    }

    if (session) {
        return (
            <>
                <HeadView />
                <Header />
                <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
                    <h1 className="text-6xl font-bold">
                        Bienvenue {user.username}
                    </h1>
                    <p className="mt-3 text-2xl">
                        Vous avez {points} points
                    </p>
                    <Image
                        src="/images/owarida.png"
                        alt="Owarida"
                        width={200}
                        height={200}
                    />
                </main>
                <Footer />
            </>
        )
    }

}