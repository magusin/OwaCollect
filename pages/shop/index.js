import React from 'react';
import { signIn, useSession } from "next-auth/react";
import Header from '@/components/header';
import { useRouter } from "next/router";
import { useEffect } from "react";
import Image from 'next/image';
import axios from 'axios'
import calculatePoints from '@/utils/calculatePoints';

const Shop = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const  [products, setProducts] = React.useState([]);
    const  [loading, setLoading] = React.useState(true);
    const  [error, setError] = React.useState(null);
    const [points, setPoints] = React.useState(0);

    useEffect(() => {
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

        if (localStorage.getItem('userOC') === null && localStorage.getItem('points') === null && session) {
            const getUser = async () => {
                try {
                    const response = await axios.get('/api/user/' + session.user.id);
                    const data = await response.data;
                    localStorage.setItem('userOC', JSON.stringify(data));
                    const calculatedPoints = calculatePoints(data);
                    const totalPoints = calculatedPoints - data.pointsUsed;
                    localStorage.setItem('points', totalPoints);
                    setPoints(totalPoints);
                } catch (error) {
                    setError(error);
                }
            };
            getUser();
        }

        // Récupérer les produits
        const fetchProducts = async () => {
            try {
                const response = await axios.get('/api/product');
                const data = await response.data;
                setProducts(data);
            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [status, router, session]);

    if (status === "loading" || loading) {
        return ( 
        <div className="flex-col content-center items-center h-screen">
            <Header />
            {/* ajouter spinner */}
            <p>Chargement...</p>
            </div> 
        )
    }
  
    if (error) {
        return (
        <div className="flex-col content-center items-center h-screen">
            <Header />
            <p>Erreur lors du chargement des produits</p>
        </div>
        )
    }


    return (
        <>
        <div className="flex-col h-screen w-full items-center ">
        <Header points={points}/>
        <div className="container mx-auto px-4">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/*  itérer sur produit */}
                {products.map((product, index) => (
                    <div key={index} className="border rounded-lg p-4 shadow hover:shadow-lg transition">
                        <Image className="w-full h-128 object-cover rounded-t-lg" src={`${product.picture}.png`} alt={`${product.name} pack picture`} width={300} height={300} priority/>
                        
                        <div className="mt-2">
                            <h2 className="text-xl font-semibold">{product.name}</h2>
                            <p className="mt-1">{product.name}</p>
                            <div className="mt-2 font-bold">Prix : {product.price} OC</div>
                            <button className={`mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 ${points < product.price ? "opacity-50 cursor-not-allowed" : ""}`} disabled={points < product.price}>Acheter</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </div>
        </>
    );
}

export default Shop;