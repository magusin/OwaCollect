import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { Client } from 'colyseus.js';
import { useSession } from 'next-auth/react';

export default function GameRoom() {
  const [myCards, setMyCards] = useState([]); // Stocker les cartes du joueur
  const [gameState, setGameState] = useState(null); // Stocker l'état général du jeu
  const router = useRouter();
  const { roomId } = router.query;
  const { data: session } = useSession();
  
  const clientRef = useRef(null);
  const roomRef = useRef(null);

  useEffect(() => {
    clientRef.current = new Client(`ws://${process.env.NEXT_PUBLIC_SERVER_URL}`);
  }, []);

  useEffect(() => {
    if (!roomId || !session) return;
    const userId = session?.user?.id || 'anonymous';
    async function joinRoom() {
      console.log('im here test')
      try {
        const room = await clientRef.current.joinById(roomId, { userId });
        roomRef.current = room;

        // Envoyer une requête pour demander le `gameState` actuel
        room.send({ type: 'requestGameState' });

        // Réception des cartes envoyées par le serveur
        room.onMessage('yourCards', (cards) => {
          setMyCards(cards);
          console.log('Your cards:', cards);
        });

        // Réception de l'état du jeu envoyé par le serveur
        room.onMessage('gameState', (state) => {
          setGameState(state);
          console.log('Game state:', state);
        });

        console.log('Successfully joined room:', room);
      } catch (error) {
        console.error('Error joining room:', error);
      }
    }

    joinRoom();

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

      {gameState && (
        <div>
          <h2>Game State:</h2>
          <pre>{JSON.stringify(gameState, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
