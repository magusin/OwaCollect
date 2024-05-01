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
import axiosInstance from "@/utils/axiosInstance";
import Head from 'next/head';

export default function Owarida({ totalPoints, errorServer }) {
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

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.post('/api/verifyCode', { code }, {
                customConfig: { session: session }
            });
           
            if (response.data.success && response.data.secretShopLink) {
                setMessage('Code correct !');
                localStorage.setItem('secretShopLink', response.data.secretShopLink);
                router.push(`/secretShop/${response.data.secretShopLink}`)
            } else if (response.data.success && response.data.secret1 || response.data.success && response.data.secret2 || response.data.success && response.data.secret3 || response.data.success && response.data.secret4 || response.data.success && response.data.secret5 || response.data.success && response.data.secret6 || response.data.success && response.data.secret7 || response.data.success && response.data.secret8) {
                setMessage(response.data.message);
                const currentPoints = parseInt(points); // Convertit points en nombre entier
                const totalPoints = currentPoints + 500;
                localStorage.setItem('points', totalPoints);
                setPoints(totalPoints);
            } else if (response.data.success && response.data.secret9 || response.data.success && response.data.secret10) {
                setMessage(response.data.message);
                const currentPoints = parseInt(points); // Convertit points en nombre entier
                const totalPoints = currentPoints + 1000;
                localStorage.setItem('points', totalPoints);
                setPoints(totalPoints);
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            if (error.response.status === 401) {
                setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
                setTimeout(() => {
                    signOut()
                    router.push('/');
                }, 3000);
            } else {
                setError('Erreur lors de la validation. ' + error.response?.data?.message || error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Gestionnaire pour afficher/masquer l'input
    const handleImageClick = () => {
        setShowInput(true);
    };

    // Gestionnaire pour masquer l'input lorsqu'un clic est effectué en dehors
    const handleClickOutside = (event) => {
        if (inputRef.current && !inputRef.current.contains(event.target)) {
            setShowInput(false);
            setMessage('');
        }
    };

    useEffect(() => {

        localStorage.setItem('points', points);
        // Ajout de l'écouteur d'événement
        document.addEventListener("mousedown", handleClickOutside);

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

            return () => {
                // Nettoyage de l'écouteur d'événement
                document.removeEventListener("mousedown", handleClickOutside);
            };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, session, error, router, points]);

    const HeadView = () => {
        return (
            <Head>
                <title>Owarida - Stream</title>
                <meta name="description" content="Owarida - Stream" />
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
            <HeadView />
            <div className="flex flex-col h-screen" style={{ marginTop: "80px" }}>
                <Header points={points} />
                <div className="flex-grow flex flex-col items-center">
                    <div onClick={handleImageClick}>
                        <Image
                            src="/images/owarida.png"
                            alt="OWARIDA ON STREAM"
                            priority={true}
                            width={600}
                            height={525}
                        />
                    </div>
                    <div className="w-full max-w-8xl my-4 px-4 flex">
                        {/* Conteneur pour le stream */}
                        <div className="flex-grow" style={{ width: '70%' }}>
                            <div className="relative" style={{ paddingTop: '58.33%' }}> {/* 700/1200 = 0.5833 */}
                                <iframe
                                    src={`https://player.twitch.tv/?channel=owarida&${darkMode ? 'darkpopout&' : ''}parent=owarida.fr`}
                                    allowFullScreen={true}
                                    seamless={true}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        overflow: 'hidden',
                                    }}
                                ></iframe>
                            </div>
                        </div>

                        {/* Conteneur pour le chat */}
                        <div className="flex-grow" style={{ width: '30%' }}>
                            <div className="relative" style={{ paddingTop: '142.85%' }}> {/* 500/350 = 1,4285 */}
                                <iframe
                                    src={`https://www.twitch.tv/embed/owarida/chat?${darkMode ? 'darkpopout&' : ''}parent=owarida.fr`}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%'
                                    }}
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
                {showInput && (
                    <div className="text-black fixed bottom-0 w-full px-4" ref={inputRef}>
                        <p className={message != '' && message.includes('Code correct !') ? "text-green-500 bg-white" : "text-red-500 bg-white"}>{message != '' ? message : 'Vous avez un code pour Owarida ?'}</p>
                        <div className="flex">
                        <input
                            className="border-2 w-full border p-2"
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <button className="text-green-500 px-4 bg-black" onClick={handleSubmit}>Vérifier</button>
                        </div>
                    </div>
                )}
                <Footer />
            </div>
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
        return {
            props: { totalPoints },
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