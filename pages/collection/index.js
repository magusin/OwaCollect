import React from "react";
import Image from 'next/image';
import axios from 'axios'
import calculatePoints from '@/utils/calculatePoints';
import { signOut, useSession } from 'next-auth/react';
import { useEffect } from "react";
import { useRouter } from 'next/router';
import Header from 'C/header';
import { getServerSession } from "next-auth";
import nextAuthOptions from "../../config/nextAuthOptions";

export default function Collection({ cards, errorServer }) {
    const [error, setError] = React.useState(errorServer || null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
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

    }, [status]);

    if (error) {
        return (
            <div className="flex flex-col h-screen">
                <Header points={points}/>
                <div className="flex-grow flex justify-center items-center">
                    <span className="text-center text-red-500">⚠ {error}</span>
                </div>
            </div>
        );
    }
    console.log('cards:', cards)


}

export async function getServerSideProps(context) {
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
        const response = await axios.get(`${process.env.NEXTAUTH_URL}/api/card`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.customJwt}`,
            }
        })
        const cards = await response.data;
        return {
            props: { cards },
        };
    } catch (error) {
        if (error.response.status === 401) {
            return {
                props: { errorServer: 'Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.' },
            };
        }
        console.log('error:', error)
        return {
            props: { errorServer: error.message },
        };
    }
}
