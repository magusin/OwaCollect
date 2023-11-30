import React from 'react';
import { signIn, useSession } from "next-auth/react";
import Header from '@/components/header';
import { useRouter } from "next/router";
import { useEffect } from "react";
import Image from 'next/image';

const Shop = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        // Rediriger seulement si l'état de la session est déterminé et qu'il n'y a pas de session
        if (status === "unauthenticated") {
            router.push('/');
        }
    }, [status, router]);
    console.log('session: ', session);
    if (status === "loading") {
        return <div>Chargement...</div>;
    }

    return (
        <>
        <Header />
        <div className="container mx-auto px-4">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/*  itérer sur produit */}
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="border rounded-lg p-4 shadow hover:shadow-lg transition">
                        <Image className="w-full h-64 object-cover rounded-t-lg" src={`https://via.placeholder.com/300?text=Produit+${index + 1}`} alt={`Produit ${index + 1}`} width={300} height={300}/>
                        
                        <div className="mt-2">
                            <h2 className="text-xl font-semibold">Produit {index + 1}</h2>
                            <p className="mt-1">Description du produit {index + 1}.</p>
                            <div className="mt-2 font-bold">Prix: $XX.XX</div>
                            <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">Ajouter au panier</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </>
    );
}

export default Shop;