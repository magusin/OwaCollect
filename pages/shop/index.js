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
import Alert from 'C/alert';
import CardsModal from 'C/cardsModal';
import { getServerSession } from "next-auth";
import nextAuthOptions from "../../config/nextAuthOptions";
import Footer from 'C/footer';
import axiosInstance from '@/utils/axiosInstance';


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
    const [showAlert, setShowAlert] = React.useState(false);
    const [alertMessage, setAlertMessage] = React.useState('');
    const [alertType, setAlertType] = React.useState(null);
    
    const handleBuyPack = () => {
        setShowModal(true);
    };

    const handleConfirmPurchase = async (selectedProduct, quantity) => {
        setLoading(true);
        setShowModal(false);
        const totalPointsCost = selectedProduct.price * quantity;
        if (points >= totalPointsCost && session) {
            try {
                const response = await axiosInstance.post(`/api/card/draw`, {
                     quantity, 
                     category: selectedProduct.name, 
                     cost: totalPointsCost 
                    }, {
                        customConfig: { session: session }
                    });

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
                    setAlertType('success');
                    setAlertMessage(`Vous avez bien acheté ${quantity} ${quantity > 1 ? "packs" : "pack"}`);
                    setShowAlert(true);
                    setTimeout(() => {
                        setShowAlert(false);
                    }, 5000);
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
                    setTimeout(() => {
                        signOut()
                        router.push('/');
                    }, 3000);
                } else {
                    setError('Erreur lors de l\'achat ' + error.response?.data?.message || error.message);;
                }
            } finally {
                setLoading(false);
            }
        } else {
            setAlertType('error');
            setAlertMessage("Vous n'avez pas assez de points pour acheter ce pack");
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 5000);
        }
    };

    useEffect(() => {
        if (error === 'Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.') {
            setTimeout(() => {
                localStorage.removeItem('userOC');
                localStorage.removeItem('points');
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
    }, [status, router, session, error]);

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


    return (
        <>
            <div className="flex flex-col min-h-screen">
                <Header points={points} />
                <div className="flex-grow container text-black mx-auto px-4 md:my-8 my-4" style={{ marginTop: "80px" }}>

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
                                        handleConfirm={(quantity) => handleConfirmPurchase(product, quantity)}
                                        title="Confirmation d'Achat"
                                        message={
                                            <>
                                                Êtes-vous sûr de vouloir acheter <b>{product.name}</b> pack pour <b>{product.price} OC</b> ?
                                            </>
                                        }
                                        maxQuantity={Math.floor(points / product.price) > 5 ? 5 : Math.floor(points / product.price)}
                                        cost={product.price}
                                        buy={true}
                                    />
                                )}
                                {showModalCards && (
                                    <CardsModal cards={drawnCards} onClose={() => setShowModalCards(false)} />
                                )}
                                {showAlert && (
                                    <Alert
                                        type={alertType}
                                        message={alertMessage}
                                        close={setShowAlert}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <Footer />
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
                cookie: context.req.headers.cookie
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
