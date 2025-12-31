import React, { useEffect, useMemo, useState } from "react";
import Image from "next/legacy/image";
import GoldParticles from "./ParticlesGold";
import GoldShineFrame from "./GoldShineFrame";

export default function CardsModal({ cards, onClose }) {
    const [currentPage, setCurrentPage] = useState(0);
    const cardsPerPage = 5;
    const [freezeFlip, setFreezeFlip] = useState(false);
    const totalPages = Math.ceil(cards.length / cardsPerPage);

    const currentCards = useMemo(
        () => cards.slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage),
        [cards, currentPage]
    );

    const [flippedCards, setFlippedCards] = useState([]);
    const [revealIndex, setRevealIndex] = useState(-1);
    const [isAutoRevealing, setIsAutoRevealing] = useState(true);

    // IMPORTANT: phase gate -> empêche de voir la face pendant les transitions
    const [phase, setPhase] = useState("idle"); // idle | revealing | recap

    // permet de rejouer l'anim au reveal
    const [revealTicks, setRevealTicks] = useState([]);

    const resetPageState = () => {
        setPhase("idle");
        setIsAutoRevealing(true);
        setRevealIndex(-1);
        setFlippedCards(new Array(currentCards.length).fill(false));
        setRevealTicks(new Array(currentCards.length).fill(0));
    };

    // Reset à chaque changement de page (et au premier rendu)
    useEffect(() => {
        resetPageState();

        // démarre le reveal à la frame suivante -> plus de flash
        const t = setTimeout(() => setPhase("revealing"), 30);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, currentCards.length]);

    // reveal auto (1 par 1)
    useEffect(() => {
        if (phase !== "revealing") return;
        if (!isAutoRevealing) return;
        if (revealIndex >= currentCards.length - 1) return;

        const next = revealIndex + 1;
        const delay = currentCards[next]?.isGold ? 900 : currentCards[next]?.rarety === "Epique" ? 650 : 420;

        const t = setTimeout(() => {
            setFlippedCards((prev) => {
                const copy = [...prev];
                copy[next] = true;
                return copy;
            });

            setRevealTicks((prev) => {
                const copy = [...prev];
                copy[next] = (copy[next] ?? 0) + 1;
                return copy;
            });

            setRevealIndex(next);
        }, delay);

        return () => clearTimeout(t);
    }, [phase, isAutoRevealing, revealIndex, currentCards]);

    useEffect(() => {
        // reset states
        setPhase("idle");
        setRevealIndex(-1);
        setFlippedCards(new Array(currentCards.length).fill(false));
        setRevealTicks(new Array(currentCards.length).fill(0));

        // IMPORTANT : on laisse 1 frame sans transition, puis on relance
        requestAnimationFrame(() => {
            setFreezeFlip(false);      // réactive transition
            setTimeout(() => setPhase("revealing"), 20); // démarre reveal après
        });
    }, [currentPage, currentCards.length]);

    const skipAll = () => {
        setIsAutoRevealing(false);
        setPhase("recap");
        setFlippedCards(new Array(currentCards.length).fill(true));
    };

    const handleNextPage = () => {
        if (currentPage >= totalPages - 1) return;

        setFreezeFlip(true);         // coupe la transition
        setPhase("idle");            // force back
        setIsAutoRevealing(true);

        // laisse React appliquer le freeze puis change la page
        requestAnimationFrame(() => {
            setCurrentPage((p) => p + 1);
        });
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-40 px-4 py-6">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-full sm:max-w-3/4 md:max-w-2/3 lg:max-w-1/2 xl:max-w-1/3 mx-auto max-h-screen overflow-y-auto relative">
                <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-600">
                        Page {currentPage + 1}/{totalPages}
                    </div>

                    <button
                        onClick={skipAll}
                        className="text-sm px-3 py-1 rounded bg-black/10 hover:bg-black/20"
                    >
                        Skip
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    {currentCards.slice(0, 2).map((card, idx) => (
                        <Card
                            key={card.pullId ?? `${currentPage}-a-${idx}`}
                            card={card}
                            // phase gate : si pas "revealing/recap", on force back
                            flipped={phase === "idle" ? false : !!flippedCards[idx]}
                            revealTick={revealTicks[idx] ?? 0}
                            freezeFlip={freezeFlip}
                            onClick={() => {
                                setIsAutoRevealing(false);
                                setPhase("revealing");
                                setFlippedCards((prev) => {
                                    const copy = [...prev];
                                    copy[idx] = !copy[idx];
                                    return copy;
                                });
                                setRevealTicks((prev) => {
                                    const copy = [...prev];
                                    copy[idx] = (copy[idx] ?? 0) + 1;
                                    return copy;
                                });
                            }}
                        />
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {currentCards.slice(2).map((card, i) => {
                        const idx = i + 2;
                        return (
                            <Card
                                freezeFlip={freezeFlip}
                                key={card.pullId ?? `${currentPage}-b-${idx}`}
                                card={card}
                                flipped={phase === "idle" ? false : !!flippedCards[idx]}
                                revealTick={revealTicks[idx] ?? 0}

                                onClick={() => {
                                    setIsAutoRevealing(false);
                                    setPhase("revealing");
                                    setFlippedCards((prev) => {
                                        const copy = [...prev];
                                        copy[idx] = !copy[idx];
                                        return copy;
                                    });
                                    setRevealTicks((prev) => {
                                        const copy = [...prev];
                                        copy[idx] = (copy[idx] ?? 0) + 1;
                                        return copy;
                                    });
                                }}
                            />
                        );
                    })}
                </div>

                <div className="flex justify-center mt-4">
                    {currentPage === totalPages - 1 ? (
                        <button onClick={onClose} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200">
                            Fermer
                        </button>
                    ) : (
                        <button onClick={handleNextPage} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200">
                            Suivant
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function Card({ card, flipped, onClick, revealTick, freezeFlip = false }) {
    // Adapte ici selon ton champ réel
    // - gold : card.isGold
    // - rare/epic : card.rarety
    const tier =
      card.isGold
        ? "gold"
        : (card.rarety === "Epique")
        ? "epic"
        : (card.rarety === "Rare")
        ? "rare"
        : "common";
  
    const frontSrc = card.isGold && card.picture_gold ? card.picture_gold : card.picture;
  
    return (
      <div
        className="card relative mx-auto cursor-pointer w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] md:w-[200px] md:h-[200px] lg:w-[250px] lg:h-[250px] xl:w-[300px] xl:h-[300px] 2xl:w-[300px] 2xl:h-[300px]"
        onClick={onClick}
        data-tier={tier}
      >
        {/* NEW badge : hors du flip => ne se retourne jamais */}
        {card.isNew && (
          <div className="absolute bottom-2 right-2 z-30 px-3 py-1 rounded-lg text-xs font-bold text-white bg-green-600 shadow-lg newBadge">
            NEW
          </div>
        )}
  
        <div className={`card-inner ${freezeFlip ? "noFlip" : ""} ${flipped ? "flipped" : ""}`}>
          {/* BACK */}
          <div className={`absolute inset-0 rounded-lg card-front ${card.isGold ? "border-4 border-yellow-500" : ""}`}>
            <Image
              src={`${card.picture_back}`}
              alt="Dos de la carte"
              layout="fill"
              objectFit="fill"
              className="rounded-lg"
              priority
            />
          </div>
  
          {/* FRONT */}
          <div className="card-back absolute inset-0">
            {/* IMPORTANT : container qui clippe TOUS les FX */}
            <div className="card-face">
              <Image
                src={`${frontSrc}`}
                alt="Carte"
                layout="fill"
                objectFit="fill"
                className="rounded-lg"
                priority
              />
  
              {/* FX reveal : uniquement quand la carte est révélée (flipped = true) */}
              {flipped && tier !== "common" && (
                <div key={`reveal-${revealTick}`} className={`revealFX ${tier}`}>
                  <span className="flash" />
                  <span className="ring" />
                  <span className="outline" />
                  <span className="sparks" />
                </div>
              )}
  
              {/* FX NEW localisé bas-droite (ne gêne pas) */}
              {flipped && card.isNew && <div key={`new-${revealTick}`} className="newFx" />}
  
              {/* GOLD spécial : tes composants existants */}
              {flipped && card.isGold && (
                <>
                  <GoldParticles />
                  <GoldShineFrame />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  

