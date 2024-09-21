import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { Client } from 'colyseus.js';
import { useSession } from 'next-auth/react';

export default function GameRoom() {
  const [myCards, setMyCards] = useState([]); // Stocker les cartes du joueur
  const [gameState, setGameState] = useState(null); // État général du jeu
  const router = useRouter();
  const { roomId } = router.query;
  const { data: session } = useSession();
  
  const clientRef = useRef(null); // Référence pour le client Colyseus
  const roomRef = useRef(null);   // Référence pour la room Colyseus

  useEffect(() => {
    clientRef.current = new Client(`ws://${process.env.NEXT_PUBLIC_SERVER_URL}`);
  }, []);

  useEffect(() => {
    if (!roomId || !session) return;
    const userId = session?.user?.id || 'anonymous';

    async function joinRoom() {
      try {
        const room = await clientRef.current.joinById(roomId, { userId });

        // Stocker la référence de la salle (room)
        roomRef.current = room;

        // Réception des cartes envoyées par le serveur
        room.onMessage('yourCards', (cards) => {
          setMyCards(cards); // Mettre à jour les cartes du joueur
          console.log('Your cards:', cards);
        });

        // Réception du message indiquant que la partie commence
        room.onMessage('startGame', (state) => {
          setGameState(state);
          console.log('Game started:', state);
        });

        console.log('Successfully joined room:', room);
      } catch (error) {
        console.error('Error joining room:', error);
      }
    }

    joinRoom();

    // Quand le composant se démonte, quitter la room
    return () => {
      if (roomRef.current) {
        roomRef.current.leave();  // Quitter la salle lorsqu'on quitte la page
        console.log('Left the room');
      }
    };
  }, [roomId, session]);

  return (
    <div>
      <h1>Game Room: {roomId}</h1>
      <h2>Your Cards:</h2>
      {myCards.length > 0 ? (
        <ul>
          {myCards.map((card, index) => (
            <li key={index}>
              <img src={card.picture} alt={card.name} />
              <p>{card.name}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading your cards...</p>
      )}
      {gameState && <h2>Game started!</h2>}
    </div>
  );
}
