// /battle/[roomId].js

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Client } from 'colyseus.js';
import { useSession } from 'next-auth/react';

export default function GameRoom() {
  const router = useRouter();
  const { roomId } = router.query;
  const { data: session, status } = useSession();
  const [room, setRoom] = useState(null);

  useEffect(() => {
    if (!roomId || status !== 'authenticated') return;

    const client = new Client('ws://localhost:3001'); // URL de votre serveur Colyseus

    async function joinGame() {
      try {
        const gameRoom = await client.joinById(roomId); // Rejoindre la salle de jeu
        setRoom(gameRoom);

        // Envoyer le `userId` au serveur
        gameRoom.send('join_game', { userId: session.user.id });

      } catch (error) {
        console.error('Erreur lors de la connexion à la salle de jeu', error);
      }
    }

    joinGame(); // Appeler la fonction pour rejoindre la salle de jeu
  }, [roomId, session, status]);

  return (
    <div>
      <h1>Jeu - Salle {roomId}</h1>
      {/* Affichage et logique du jeu à implémenter ici */}
    </div>
  );
}
