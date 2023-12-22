import React, { useState } from 'react';
import Image from 'next/legacy/image';

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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-70 h-full w-full overflow-y-auto flex justify-center items-center z-50 px-4 py-6">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-4/5 mx-auto">
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
    return (
        <div className="card relative mx-auto cursor-pointer w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] md:w-[200px] md:h-[200px] lg:w-[250px] lg:h-[250px] xl:w-[300px] xl:h-[300px] 2xl:w-[350px] 2xl:h-[350px]" onClick={onClick} >
            <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
                <div className="absolute inset-0 rounded-lg card-front">
                    <Image src={`${card.picture_back}.png`} alt={`Dos de la carte ${index}`} layout="fill" objectFit="fill" className="rounded-lg" priority={true} />
                </div>
                <div className={`card-back absolute inset-0 transform ${flipped ? 'rotate-y-180' : ''}`}>
                    <Image src={`${card.picture}.png`} alt={`Carte ${index}`} layout="fill" objectFit="fill" className="rounded-lg" priority={true} />
                </div>
            </div>
        </div>
    );
}