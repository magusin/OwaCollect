import React from 'react';
import { signIn, useSession } from "next-auth/react";
import Header from '@/components/header';
import { useRouter } from "next/router";
import { useEffect } from "react";
import Image from 'next/image';
import axios from 'axios'

const Shop = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const  [products, setProducts] = React.useState([]);
    const  [loading, setLoading] = React.useState(true);
    const  [error, setError] = React.useState(null);

    useEffect(() => {
        // Rediriger seulement si l'état de la session est déterminé et qu'il n'y a pas de session
        if (status === "unauthenticated") {
            router.push('/');
        }

        // Récupérer les produits
        const fetchProducts = async () => {
            try {
                const response = await axios.get('/api/product');
                const data = await response.data;
                setProducts(data);
                console.log('data: ', data);
            } catch (error) {
                setError(error);
                console.log(error)
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [status, router]);

    if (status === "loading" || loading) {
        return <div>Chargement...</div>;
    }
  
    if (error) {
        return <div>Erreur lors du chargement des produits</div>;
    }


    return (
        <>
        <Header />
        <div className="container mx-auto px-4">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/*  itérer sur produit */}
                {products.map((product, index) => (
                    <div key={index} className="border rounded-lg p-4 shadow hover:shadow-lg transition">
                        <Image className="w-full h-128 object-cover rounded-t-lg" src={`${product.picture}.png`} alt={`${product.name} pack picture`} width={300} height={300} priority/>
                        
                        <div className="mt-2">
                            <h2 className="text-xl font-semibold">{product.name}</h2>
                            <p className="mt-1">{product.name}</p>
                            <div className="mt-2 font-bold">{product.price}</div>
                            <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">Acheter</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </>
    );
}

export default Shop;