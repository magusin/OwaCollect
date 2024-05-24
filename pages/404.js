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
import Link from "next/link";

export default function Alley() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [points, setPoints] = React.useState(0);
    const [error, setError] = React.useState(null);
    const [isMobile, setIsMobile] = React.useState(false);


    function HeadView() {
        return (
            <Head>
                <title>404 - Owarida</title>
                <meta name="description" content="Page 404" />
                <meta name="keywords" content="owarida, owarida collect, twitch, elden ring, dark souls" />
            </Head>
        )
    }

    useEffect(() => {
        const handleResize = () => {
          setIsMobile(window.innerWidth < 1024);
        };
    
        // Vérifier la taille de l'écran au montage du composant
        handleResize();
    
        // Ajouter l'écouteur d'événements pour les redimensionnements de fenêtre
        window.addEventListener('resize', handleResize);
    
        // Nettoyer l'écouteur d'événements lors du démontage du composant
        return () => window.removeEventListener('resize', handleResize);
      }, []);

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
            <Header points={points} />
            <div className="relative flex-grow flex justify-center">
              {isMobile ? (
                <Image
                  src="/images/404.webp"
                  alt="404"
                  layout="responsive"
                  objectFit="contain"
                  width={1920}
                  height={1080}
                  priority
                />
              ) : (
                <Image
                  src="/images/404-2.webp"
                  alt="404"
                  layout="responsive"
                  objectFit="contain"
                  width={1920}
                  height={1080}
                  priority
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                <p className="mb-8 text-black text-3xl md:text-4xl shadow-lg font-bold bg-black/5">
                  Vous aussi vous vous perdez facilement comme Owa ?
                </p>
              </div>
              <div className="absolute p-4 bottom-8 flex items-center text-center justify-center">
                <Link href="/" className="text-lg md:text-xl bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Retour à l&apos;accueil
                </Link>
              </div>
            </div>
            <Footer />
          </div>
        </>
      );
}