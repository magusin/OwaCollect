/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { signOut, useSession } from "next-auth/react";
import Header from 'C/header';
import { useRouter } from "next/router";
import { useEffect } from "react";
import Image from 'next/image';
import axios from 'axios'
import calculatePoints from '@/utils/calculatePoints';
import Modal from 'C/modal';
import CardsModal from 'C/cardsModal';
import { getServerSession } from "next-auth";
import nextAuthOptions from "../../config/nextAuthOptions";

export default function Shop({ productsData, errorServer }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [products, setProducts] = React.useState(productsData);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(errorServer || null);
    const [points, setPoints] = React.useState(0);
    const [showModal, setShowModal] = React.useState(false);
    const [drawnCards, setDrawnCards] = React.useState([]);
    const [showModalCards, setShowModalCards] = React.useState(false);

    const handleBuyPack = () => {
        setShowModal(true);
    };

    const handleConfirmPurchase = async (selectedProduct) => {
        setLoading(true);
        setShowModal(false);
        if (points >= selectedProduct.price && session) {
            try {
                const response = await axios.get(`/api/card/draw/${selectedProduct.name}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.customJwt}`,
                    }
                })

                // if response status is 200 then set cards in state and show modal
                if (response.status === 200) {
                    const data = await response.data;
                    // await editUserPoints(selectedProduct);
                    localStorage.setItem('userOC', JSON.stringify(data.userData));
                    const totalPoints = calculatePoints(data.userData);
                    localStorage.setItem('points', totalPoints);
                    setPoints(totalPoints);
                    setDrawnCards(data.selectedCards);
                    setShowModalCards(true);
                }
            } catch (error) {
                if (error.response.status === 401) {
                    setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
                    setTimeout(() => {
                        signOut()
                        router.push('/');
                    }, 3000);
                } else {
                    setError('Erreur lors du tirage des cartes');
                }
            } finally {
                setLoading(false);
            }
        } else {
            setError("Vous n'avez pas assez de points pour acheter ce pack");
        }
    };

    useEffect(() => {
        if (error === 'Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.') {
            setTimeout(() => {
                signOut()
                router.push('/');
            }, 2000);
        }
        // Rediriger seulement si l'état de la session est déterminé et qu'il n'y a pas de session
        if (status === "unauthenticated") {
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
    }, [status, router, session, error]);

    if (status === "loading" || loading) {
        return (
            <div className="flex flex-col h-screen">
                <Header points={points} />
                <div className="flex-grow flex justify-center items-center">
                    <span className="text-center">Chargement ...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col h-screen">
                <Header points={points} />
                <div className="flex-grow flex justify-center items-center">
                    <span className="text-center text-red-500">⚠ {error}</span>
                </div>
            </div>
        );
    }


    return (
        <>
            <div className="flex-col min-h-screen ">
                <Header points={points} />
                <div className="container mx-auto px-4 md:my-8 my-4">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/*  itérer sur produit */}
                        {products.map((product, index) => (
                            <div key={index} className="border rounded-lg p-4 shadow hover:shadow-lg transition bg-white">
                                <Image className="w-full h-auto object-cover rounded-t-lg" src={`${product.picture}.png`} alt={`${product.name} pack picture`} width={300} height={300} priority />

                                <div className="mt-2">
                                    <h2 className="text-xl font-semibold">{product.name}</h2>
                                    <p className="mt-1">{product.name}</p>
                                    <div className="mt-2 font-bold">Prix : {product.price} OC</div>
                                    <button onClick={handleBuyPack} className={`mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 ${points < product.price ? "opacity-50 cursor-not-allowed" : ""}`} disabled={points < product.price}>Acheter</button>
                                </div>
                                {showModal && (
                                    <Modal
                                        setShowModal={setShowModal}
                                        handleConfirm={() => handleConfirmPurchase(product)}
                                        title="Confirmation d'Achat"
                                        message={
                                            <>
                                                Êtes-vous sûr de vouloir acheter <b>{product.name}</b> pack pour <b>{product.price} OC</b> ?
                                            </>
                                        }
                                    />
                                )}
                                {showModalCards && (
                                    <CardsModal cards={drawnCards} onClose={() => setShowModalCards(false)} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
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
        const response = await axios.get(`${process.env.NEXTAUTH_URL}/api/product`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.customJwt}`,
            }
        })
        const productsData = await response.data;
        return {
            props: { productsData },
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
