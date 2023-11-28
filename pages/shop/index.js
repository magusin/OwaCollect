import React from 'react';
import { signIn, useSession } from "next-auth/react";
import Header from '@/components/header';

const Shop = () => {
    const { data: session } = useSession();
    console.log(session)
    return (
        <>
            <Header />
        <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold my-8">Boutique</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/*  itérer sur produit */}
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="border rounded-lg p-4 shadow hover:shadow-lg transition">
                        <img className="w-full h-64 object-cover rounded-t-lg" src={`https://via.placeholder.com/300?text=Produit+${index + 1}`} alt={`Produit ${index + 1}`} />
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