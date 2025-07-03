import React, { useState } from 'react';
import Image from 'next/legacy/image';
import GoldParticles from './ParticlesGold';
import GoldShineFrame from './GoldShineFrame';

export default function CardsModal({ cards, onClose }) {
    const [currentPage, setCurrentPage] = useState(0);
    const cardsPerPage = 5;
    const totalPages = Math.ceil(cards.length / cardsPerPage);
    const currentCards = cards.slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage);
    const [flippedCards, setFlippedCards] = useState(new Array(cardsPerPage).fill(false)); // Remplissez avec false pour la longueur de la page actuelle

    const flipCard = (index) => {
        const newFlippedCards = [...flippedCards];
        newFlippedCards[index] = !newFlippedCards[index]; // Basculer l'état flipped
        setFlippedCards(newFlippedCards);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            setFlippedCards(new Array(cardsPerPage).fill(false)); // Réinitialiser flippedCards pour la nouvelle page
            setTimeout(() => {
                setCurrentPage(currentPage + 1);
            }, 300); // 300 millisecondes de retard
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center overflow-y-auto z-40 px-4 py-6 overflow-y-hidden">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-full sm:max-w-3/4 md:max-w-2/3 lg:max-w-1/2 xl:max-w-1/3 mx-auto overflow-y-auto max-h-screen">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {currentCards.slice(0, 2).map((card, index) => (
                        <Card key={index} card={card} index={index} flipped={flippedCards[index]} onClick={() => flipCard(index)} />
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {currentCards.slice(2).map((card, index) => (
                        <Card key={index} card={card} index={index + 2} flipped={flippedCards[index + 2]} onClick={() => flipCard(index + 2)} />
                    ))}
                </div>
                <div className="flex justify-center mt-4">
                    {currentPage === totalPages - 1 ? (
                        <button onClick={onClose} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200">Fermer</button>
                    ) : (
                        <button onClick={handleNextPage} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200">Suivant</button>
                    )}
                </div>
            </div>
        </div>
    );
}

function Card({ card, index, flipped, onClick }) {
    return (
        <div className="card relative mx-auto cursor-pointer w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] md:w-[200px] md:h-[200px] lg:w-[250px] lg:h-[250px] xl:w-[300px] xl:h-[300px] 2xl:w-[300px] 2xl:h-[300px]" onClick={onClick} >
            <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
                {/* // Afficher l'image de la carte */}
                <div className={`absolute inset-0 rounded-lg card-front ${card.isGold ? 'border-4 border-yellow-500' : ''}`}>
                    <Image src={`${card.picture_back}`} alt={`Dos de la carte ${index}`} layout="fill" objectFit="fill" className="rounded-lg" priority={true} />
                </div>
                {/* // Si card.isNew est vrai, ajoutez un NEW */}
                {card.isNew && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white text-xs font-bold px-4 py-2 rounded">
                        NEW
                    </div>
                )}
                {card.isGold && (
                    <>
                        <GoldParticles />
                        <GoldShineFrame />
                    </>
                )}
                <div className={`card-back absolute inset-0 transform ${flipped ? 'rotate-y-180' : ''}`}>
                    <Image src={`${card.picture}`} alt={`Carte ${index}`} layout="fill" objectFit="fill" className="rounded-lg" priority={true} />
                </div>
            </div>
        </div>
    );
}