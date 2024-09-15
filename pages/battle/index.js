import { useState } from 'react';
import { useRouter } from 'next/router';
import { Client } from 'colyseus.js';
import { useSession } from 'next-auth/react';

export default function BattleIndex() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  // Utilisez wss:// pour les connexions sécurisées
  const client = new Client('wss://colyseus-production.up.railway.app');

  const findGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = session?.user?.id || 'anonymous';
      
      // Appel de l'API de matchmaking en passant l'ID utilisateur
      const response = await fetch(`https://colyseus-production.up.railway.app/matchmaking?userId=${userId}`);
      const data = await response.json();

      if (data.roomId) {
        console.log(`Attempting to join room with ID: ${data.roomId}`);
        // Rejoindre la salle avec l'ID utilisateur
        const room = await client.joinById(data.roomId, { userId });

        // Stocker l'ID de la salle dans localStorage
        localStorage.setItem('roomId', room.id);

        // Rediriger vers la page de la salle
        router.push(`/battle/${room.id}`);
      } else {
        setError('No room ID received from server.');
      }
    } catch (error) {
      console.error('Error finding or joining room:', error);
      setError('Failed to join the room. Please try again.');
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
