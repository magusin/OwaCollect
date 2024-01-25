import React from "react";
import { useEffect } from "react";
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Header from 'C/header';
import Image from 'next/legacy/image';
import calculatePoints from "@/utils/calculatePoints";
import { useDarkMode } from "@/contexts/darkModeContext";
import Footer from "C/footer";
import axiosInstance from "@/utils/axiosInstance";

export default function Owarida() {
    const [error, setError] = React.useState(null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [points, setPoints] = React.useState(0);
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
           
            if (response.data.success) {
                setMessage('Code correct !');
                localStorage.setItem('secretShopLink', response.data.secretShopLink);
                router.push(`/secretShop/${response.data.secretShopLink}`)
            } else {
                setMessage('Code incorrect.');
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

        // Ajout de l'écouteur d'événement
        document.addEventListener("mousedown", handleClickOutside);

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

            return () => {
                // Nettoyage de l'écouteur d'événement
                document.removeEventListener("mousedown", handleClickOutside);
            };
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
                <Footer />
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
                <Footer />
            </div>
        )
    }

    if (session) {
        return (
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
                        <p className={message != '' && message != 'Code correct !' ? "text-red-500" : "text-green-500"}>{message != '' ? message : 'Vous avez un code pour Owarida ?'}</p>
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
        );
    }



}