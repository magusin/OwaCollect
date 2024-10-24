import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Client } from 'colyseus.js';
import { useSession } from 'next-auth/react';

export default function BattleIndex() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const clientRef = useRef(null);
  const roomRef = useRef(null);

  useEffect(() => {
    clientRef.current = new Client(`ws://${process.env.NEXT_PUBLIC_SERVER_URL}`);
    console.log('Initialized Colyseus client');
  }, []);

  const findGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = session?.user?.id || 'anonymous';
      console.log(`User ID: ${userId}`);

      // Appel de l'API pour trouver ou créer une room
      const response = await fetch(`http://${process.env.NEXT_PUBLIC_SERVER_URL}/matchmaking?userId=${userId}`);
      const data = await response.json();
      console.log(`Matchmaking response:`, data);

      if (data.roomId) {
        console.log(`Attempting to join room with ID: ${data.roomId}`);
        // Joindre la room avec l'ID utilisateur
        const room = await clientRef.current.joinById(data.roomId, { userId });
        roomRef.current = room;

        room.onMessage('startGame', (message) => {
          console.log('Game started:', message);
          router.push(`/battle/${room.id}`);
        });

        console.log('Joined room:', room.id);
      } else {
        setError('No room ID received from server.');
      }
    } catch (error) {
      console.error('Error finding or joining room:', error.message);
      setError('Failed to join the room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Rechercher une partie</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={findGame} disabled={loading}>
        {loading ? 'Recherche en cours...' : 'Rechercher une partie'}
      </button>
    </div>
  );
}
