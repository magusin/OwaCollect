import React, { useState } from 'react';
import Image from 'next/image';

export default function CardsModal({ cards, onClose }) {
    const [flippedCards, setFlippedCards] = useState(new Array(cards.length).fill(false));

    const flipCard = (index) => {
        // Retourne la carte si elle est face cachée
        if (!flippedCards[index]) {
            const newFlippedCards = [...flippedCards];
            newFlippedCards[index] = true;
            setFlippedCards(newFlippedCards);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center py-8">
            <div className="bg-white p-8 rounded-lg shadow-lg w-4/5 mx-auto ">
                <div className="grid grid-cols-2 mb-4">
                    {cards.slice(0, 2).map((card, index) => (
                        <Card key={index} card={card} index={index} flipped={flippedCards[index]} onClick={() => flipCard(index)} />
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {cards.slice(2).map((card, index) => (
                        <Card key={index} card={card} index={index + 2} flipped={flippedCards[index + 2]} onClick={() => flipCard(index + 2)} />
                    ))}
                </div>
                <div className="flex justify-center mt-4">
                <button onClick={onClose} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200">Fermer</button>
                </div>
            </div>
        </div>
    );
}

function Card({ card, index, flipped, onClick }) {
    console.log('card:', card)
    return (
        <div className="card relative mx-auto cursor-pointer" onClick={onClick} >
            <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
                <div className="absolute inset-0 bg-blue-500 rounded-lg card-front">
                    <Image src={`${card.picture_back}.png`} alt={`Dos de la carte ${index}`} layout="fill" objectFit="contain" className="rounded-lg" priority={true} />
                </div>
                <div className={`card-back absolute inset-0 transform ${flipped ? 'rotate-y-180' : ''}`}>
                    <Image src={`${card.picture}.png`} alt={`Carte ${index}`} layout="fill" objectFit="contain" className="rounded-lg" priority={true} />
                </div>
            </div>
        </div>
    );
}