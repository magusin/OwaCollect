/* eslint-disable react/no-unescaped-entities */
import React, {useEffect} from 'react';
import { signOut, useSession } from 'next-auth/react';
import axios from 'axios';
import { getServerSession } from "next-auth";
import nextAuthOptions from "../../config/nextAuthOptions";
import { useRouter } from 'next/router';
import calculatePoints from '@/utils/calculatePoints';
import Header from 'C/header';
import Footer from 'C/footer';
import Pusher from 'pusher-js';

export default function Duel({ errorServer, duelInfo}) {
    
    const { data: session, status } = useSession();
    const router = useRouter();
    const [error, setError] = React.useState(errorServer || null);
    const [points, setPoints] = React.useState(0);
    const { id } = router.query; 
    const [loading, setLoading] = React.useState(false);  

    const pusher = new Pusher('96c01ff6052b2c529504', {
        cluster: 'eu'
      });


    const registerP2 = async () => {    
        setLoading(true);
        try {
            const response = await axios.put(`/api/duel/${id}`, {bet: duelInfo.bet}, {
                headers: {
                    Authorization: `Bearer ${session.customJwt}`,
                },
            });
            const data = await response.data;
            console.log(data)
            setLoading(false);
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
    }

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
      
          // S'abonner au canal spécifique au duel
          const channel = pusher.subscribe(`duel-${id}`);
      
          pusher.connection.bind('connected', function() {
            console.log('Pusher successfully connected');
          });

          // Écouter un événement
          channel.bind('duel-action', function(data) {
            // Gérer l'action ici
            console.log('Received data:', data);
          });

          axios.post("/api/pusher", { duelId: id });
      
          // Nettoyage lors du démontage du composant
          return () => {
            pusher.unsubscribe(`duel-${id}`);
          };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, session, error, router, id]);

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
        if (duelInfo.player1Id && !duelInfo.player2Id) {
            if (session.user.id === duelInfo.player1Id) {
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
                    <div className="flex flex-col h-screen">
                        <Header points={points} />
                        <div className="flex-grow flex flex-col justify-center items-center">
                            <span className="mb-4 text-center">Voulez vous accepter de relever le duel de <b>{duelInfo.pets_duels_player1IdTopets.name}</b> en misant <b>{duelInfo.bet} OC</b> ?</span>
                            <span><button className='bg-green-500 py-2 px-4 rounded mr-4' onClick={registerP2} disabled={points < duelInfo.bet}>Accepter</button><button className='bg-red-500 py-2 px-4 rounded'>Refuser</button></span>                          
                        </div>
                        <Footer />
                    </div>
                );
            }
        }

        if (duelInfo.player1Id && duelInfo.player2Id) {
            if (session.user.id === duelInfo.player1Id || session.user.id === duelInfo.player2Id) {
                return (
                    <div className="flex flex-col h-screen">
                        <Header points={points} />
                        <div className="flex-grow flex justify-center items-center">
                            <span className="text-center">Vous êtes un des joueur</span>
                        </div>
                        <Footer />
                    </div>
                );
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

        return (
            <div className="flex flex-col h-screen">
                <Header points={points} />
                <div className="flex-grow flex justify-center items-center">
                    <span className="text-center">Duel {id}</span>
                </div>
                <Footer />
            </div>
        );
        // if ((session.user.id === duelInfo.player1Id) && !duelInfo.player2Id) {
        //     return (
        //         <div className="flex flex-col h-screen">
        //             <Header points={points} />
        //             <div className="flex-grow flex justify-center items-center">
        //                 <span className="text-center">En attente d'un autre joueur</span>
        //             </div>
        //             <Footer />
        //         </div>
        //     );
        // }
        // if (session.user.id === duelInfo.player1Id && duelInfo.player2Id) {
        //     return (
        //         <div className="flex flex-col h-screen">
        //             <Header points={points} />
        //             <div className="flex-grow flex justify-center items-center">
        //                 <span className="text-center">Vous êtes le joueur 1</span>
        //             </div>
        //             <Footer />
        //         </div>
        //     );
        // }
    }

}

export async function getServerSideProps(context) {
    const { id } = context.params;

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
        const response = await axios.get(`${process.env.NEXTAUTH_URL}/api/duel/${id}`, {
            headers: {
                Authorization: `Bearer ${session.customJwt}`,
            },
        });
        // récupérer les données du duel
        const duelInfo = await response.data;
        return {
            props: { duelInfo },
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
