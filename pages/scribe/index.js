/* eslint-disable react/no-unescaped-entities */
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

export default function Scribe() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [points, setPoints] = React.useState(0);
    const [page, setPage] = React.useState(0);

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
                <title>Owarida Collect | Scribe</title>
                <meta name="description" content="Les écrits du scribe." />
                <meta name="keywords" content="Owarida, owarida collect, scribe, owarida carte" />
                <link rel="icon" href="/favicon.ico" />
                <link href="https://fonts.googleapis.com/css2?family=Style+Script&display=swap" rel="stylesheet"></link>
                <link href="https://fonts.googleapis.com/css2?family=Road+Rage&display=swap" rel="stylesheet"></link>
            </Head>
        )
    }

    if (session) {
        return (
            <>
                <HeadView />
                <div className="flex flex-col min-h-screen">
                    <Header points={points}/>
                    <div style={{
                        backgroundImage: `url('/images/paper-scribe.png')`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        width: '100%',
                        height: '100vh'
                    }}>
                        <div className="m-4 text-black" style={{ marginTop: "80px" }}>
                            {page === 0 && (
                                <div className="flex flex-col items-center">
                                    <h1 className="text-4xl text-center font-bold my-4">Les écrits du scribe</h1>
                                    <p className="text-center">Le scribe a laissé d&apos;étranges écrits.</p>
                                    <p>Il semble que chaque page parle d'un thème.</p>
                                    <p className="italic">Si vous pensez avoir trouvé un thème ou un code, rendez-vous sur la page Owarida et rentrez-le en cliquant sur l'image d'Owarida.</p>
                                    <button style={{ fontFamily: 'Style Script, cursive' }} className='font-bold text-xl p-2 rounded-lg mt-4' onClick={() => setPage(1)} >Page 1 (01 / 12 / 04 - TQWBYI)</button>
                                    <button style={{ fontFamily: 'Style Script, cursive' }} className='font-bold text-xl p-2 rounded-lg mt-4' onClick={() => setPage(2)} >Page 2 (17 / 02 / 06 - TKIRFG)</button>
                                    <button style={{ fontFamily: 'Style Script, cursive' }} className='font-bold text-xl p-2 rounded-lg mt-4' onClick={() => setPage(3)} >Page 3 (23 / 05 / 11 - BVTDUL)</button>
                                    <button style={{ fontFamily: 'Style Script, cursive' }} className='font-bold text-xl p-2 rounded-lg mt-4 mb-4' onClick={() => setPage(4)} >Page 4 (05 / 01 / 14 - BBIZFR)</button>

                                    <button style={{ fontFamily: 'Style Script, cursive' }} className='font-bold text-xl p-2 rounded-lg mt-4' onClick={() => setPage(6)} >Page 6 (10x10x6 - AZERTY)</button>
                                </div>
                            )}
                            {page === 1 && (
                                <div className="flex flex-col text-2xl leading-9 font-bold" style={{ fontFamily: 'Style Script, cursive', minHeight: "calc(100vh - 80px)" }}>
                                    <div className="flex-grow relative">
                                    <ul className="my-4 mx-8 ">
                                        <li>O2014-11-19 : Je n'aime pas les framboises, ça fait de moi une mauvaise personne ?</li>
                                        <li>F2012-02-02 : Il est jaloux d'un de mes talents qu'il n'aura jamais; perdre aux jeux.</li>
                                        <li>E2022-03-22 : Pourquoi ce flux vidéo m'insulte tout le temps ? Tant de chansons offensantes ...</li>
                                        <li>K2013-07-31 : Il pourrait forger mais il préfère sporter.</li>
                                        <li>K2014-09-15 : Tellement de force P = m x g</li>
                                        <li>G2020-04-06 : La riritude aiguë est très contagieuse.</li>
                                        <li>D2013-09-29 : Si douce est sa voix, si dur est son combat.</li>
                                    </ul>
                                    </div>
                                    <button style={{ fontFamily: 'Style Script, cursive' }} className='font-bold text-xl p-2 rounded-lg mt-4' onClick={() => setPage(0)} >Retourner aux notes</button>
                                    <div className="flex justify-center my-4">
                                        <button onClick={() => setPage(page - 1)} className="absolute left-0 top-1/2 transform -translate-y-1/2 text-black-600 hover:text-black-800 focus:outline-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button onClick={() => setPage(page + 1)} className="absolute right-0 top-1/2 transform -translate-y-1/2 text-black-600 hover:text-black-800 focus:outline-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                            {page === 2 && (
                                <div className="flex flex-col text-2xl leading-9 font-bold" style={{ fontFamily: 'Style Script, cursive', minHeight: "calc(100vh - 80px)" }}>
                                    <div className="flex-grow relative">
                                    <ul className="my-4 mx-8 ">
                                        <li>Certains en parlent mais jamais personne ne le voit.</li>
                                        <li>GTA a une dernière quête pour le traquer.</li>
                                        <li>Comment une si grosse bête peut être si discrète ?</li>
                                        <li>Plus qu'une légende moderne, il continue d'inspirer.</li>
                                        <li>Sa dernière position semble être en Amérique du Nord.</li>
                                        <li>Je crois que Sam et Dean l'ont finalement trouvé.</li>
                                    </ul>
                                    </div>
                                    <button style={{ fontFamily: 'Style Script, cursive' }} className='font-bold text-xl p-2 rounded-lg mt-4' onClick={() => setPage(0)} >Retourner aux notes</button>
                                    <div className="flex justify-center my-4">
                                        <button onClick={() => setPage(page - 1)} className="absolute left-0 top-1/2 transform -translate-y-1/2 text-black-600 hover:text-black-800 focus:outline-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button onClick={() => setPage(page + 1)} className="absolute right-0 top-1/2 transform -translate-y-1/2 text-black-600 hover:text-black-800 focus:outline-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                            {page === 3 && (
                                <div className="flex flex-col text-2xl leading-9 font-bold" style={{ fontFamily: 'Style Script, cursive', minHeight: "calc(100vh - 80px)" }}>
                                    <div className="flex-grow relative">
                                    <ul className="my-4 mx-8 ">
                                        <li>Dans le métro j'ai trébuché, j'ai cru que j'allais noclip pendant un instant.</li>
                                        <li>L'eau d'amande m'aide grandement à ne pas perdre l'esprit.</li>
                                        <li>Level 0 : Je suis seul, cette tapisserie jaunâtre m'écoeure, tout se ressemble et je ne sais où aller.</li>
                                        <li>Level 4 : Ce bureau est vide, chaque espace liminale me semble étrange, m'apaise mais renforce ma solitude.</li>
                                        <li>Level 54 : Cet escalier ne finit jamais ? Je monte ou je descends ?</li>
                                        <li>Level 100 : Cette plage est agréable, je ne réponds pas aux voix ni ne regarde les sourires insistants mais je sais que le rôdeur de l'ombre viendra la nuit tombée.</li>
                                    </ul>
                                    </div>
                                    <button style={{ fontFamily: 'Style Script, cursive' }} className='font-bold text-xl p-2 rounded-lg mt-4' onClick={() => setPage(0)} >Retourner aux notes</button>
                                    <div className="flex justify-center my-4">
                                        <button onClick={() => setPage(page - 1)} className="absolute left-0 top-1/2 transform -translate-y-1/2 text-black-600 hover:text-black-800 focus:outline-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button onClick={() => setPage(page + 1)} className="absolute right-0 top-1/2 transform -translate-y-1/2 text-black-600 hover:text-black-800 focus:outline-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                            {page === 4 && (
                                <div className="flex flex-col text-2xl leading-9" style={{ fontFamily: 'Style Script, cursive', minHeight: "calc(100vh - 80px)" }}>
                                <div className="flex-grow relative" style={{ paddingTop: "80px" }}>
                                    <div className="my-4 mx-8 absolute inset-0 flex items-center justify-center">
                                        <Image src="/images/page4.png" alt="Owarida" priority={true} layout="fill" />
                                    </div>
                                </div>
                                <button style={{ fontFamily: 'Style Script, cursive' }} className='font-bold text-xl p-2 rounded-lg mt-4' onClick={() => setPage(0)} >Retourner aux notes</button>
                                <div className="flex justify-center my-4">
                                        <button onClick={() => setPage(page - 1)} className="absolute left-0 top-1/2 transform -translate-y-1/2 text-black-600 hover:text-black-800 focus:outline-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button onClick={() => setPage(page + 1)} className="absolute right-0 top-1/2 transform -translate-y-1/2 text-black-600 hover:text-black-800 focus:outline-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                            </div>
                            )}
                            {page === 5 && (
                                <div className="flex flex-col text-2xl leading-9" style={{ fontFamily: 'Road Rage, sans-serif', minHeight: "calc(100vh - 80px)" }}>
                                <div className="flex-grow relative" style={{ paddingTop: "80px" }}>
                                    <div className="my-4 mx-8 absolute inset-0 flex items-center justify-center">
                                       <p>Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie Code error 5 : 5 lie</p>
                                    </div>
                                </div>
                                <button style={{ fontFamily: 'Style Script, cursive' }} className='font-bold text-xl p-2 rounded-lg mt-4' onClick={() => setPage(0)} >Retourner aux notes</button>
                                <div className="flex justify-center my-4">
                                        <button onClick={() => setPage(page - 1)} className="absolute left-0 top-1/2 transform -translate-y-1/2 text-black-600 hover:text-black-800 focus:outline-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button onClick={() => setPage(page + 1)} className="absolute right-0 top-1/2 transform -translate-y-1/2 text-black-600 hover:text-black-800 focus:outline-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                            </div>
                            )}
                            {page === 6 && (
                                <div className="flex flex-col text-2xl leading-9 font-bold" style={{ fontFamily: 'Style Script, cursive', minHeight: "calc(100vh - 80px)" }}>
                                    <div className="flex-grow relative">
                                    <ul className="my-4 mx-8 ">
                                        <li>13 1 26 12  19 3 12  3 5 9 8 19 3 12  5 7  3 12  26 9 25 19 3</li>
                                        <li>15 9 26 14 19 3  19 3 12  25 1 19 19 9 26 12  8 19 12  24 9 19 19 3 26 5</li>
                                        <li>4 3 12 10 8 4 3  20 1  24 9 8 22  13 3 23 9 19 19 3</li>
                                    </ul>
                                    </div>
                                    <button style={{ fontFamily: 'Style Script, cursive' }} className='font-bold text-xl p-2 rounded-lg mt-4' onClick={() => setPage(0)} >Retourner aux notes</button>
                                    <div className="flex justify-center my-4">
                                        <button onClick={() => setPage(page - 1)} className="absolute left-0 top-1/2 transform -translate-y-1/2 text-black-600 hover:text-black-800 focus:outline-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <Footer />
                </div>
            </>
        )
    }

}