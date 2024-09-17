import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Client } from 'colyseus.js';
import { useSession } from 'next-auth/react';

export default function BattleIndex() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();
  const clientRef = useRef(null);

  // Initialiser le client Colyseus une seule fois
  useEffect(() => {
    clientRef.current = new Client(`wss://${process.env.NEXT_PUBLIC_SERVER_URL}`);
  }, []);

  // Vérifier s'il y a une salle stockée dans localStorage au montage du composant
  useEffect(() => {
    const storedRoomId = localStorage.getItem('roomId');
    const userId = session?.user?.id || 'anonymous';

    if (storedRoomId && !isJoining) {
      console.log(`Trying to reconnect to room with ID: ${storedRoomId}`);
      setIsJoining(true);
      clientRef.current.joinById(storedRoomId, { userId })
        .then((room) => {
          console.log('Reconnected to room:', room);
          router.push(`/battle/${room.id}`);
        })
        .catch((error) => {
          console.error('Failed to reconnect to the room:', error.message);
          // Supprimer l'ID de salle stocké si échec
          localStorage.removeItem('roomId');
        })
        .finally(() => {
          setIsJoining(false);
        });
    }
  }, [session, router, isJoining]);

  const findGame = async () => {
    if (isJoining) return; // Empêche la double connexion

    setLoading(true);
    setError(null);
    setIsJoining(true);
    try {
      const userId = session?.user?.id || 'anonymous';

      // Appel de l'API de matchmaking en passant l'ID utilisateur
      console.log('Calling matchmaking API...');
      const response = await fetch(`https://${process.env.NEXT_PUBLIC_SERVER_URL}/matchmaking?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Matchmaking API responded with status ${response.status}`);
      }

      const data = await response.json();

      if (data.roomId) {
        console.log(`Attempting to join room with ID: ${data.roomId}`);
        // Rejoindre la salle avec l'ID utilisateur
        const room = await clientRef.current.joinById(data.roomId, { userId });

        // Stocker l'ID de la salle dans localStorage
        localStorage.setItem('roomId', room.id);

        // Rediriger vers la page de la salle
        router.push(`/battle/${room.id}`);
      } else {
        setError('No room ID received from server.');
      }
    } catch (error) {
      console.error('Error finding or joining room:', error.message);
      setError('Failed to join the room. Please try again.');
      
      // En cas d'erreur, supprimer l'ID de la salle du localStorage pour éviter les boucles d'erreurs
      localStorage.removeItem('roomId');
    } finally {
      setLoading(false);
      setIsJoining(false);
    }
  };

  return (
    <div>
      <h1>Rechercher une partie</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={findGame} disabled={loading || isJoining}>
        {loading ? 'Recherche en cours...' : 'Rechercher une partie'}
      </button>
    </div>
  );
}
