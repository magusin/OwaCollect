// /battle.js

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react'; // Hook NextAuth pour récupérer la session
import { Client } from 'colyseus.js';

export default function SearchGame() {
  const { data: session, status } = useSession(); // Récupérer la session
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [room, setRoom] = useState(null);

  // Fonction pour lancer la recherche de partie
  const startSearch = async () => {
    if (status === 'authenticated') {
      const userId = session.user.id; // Récupérer l'userId de la session NextAuth
      setSearching(true);
      setMessage('Recherche de partie en cours...');

      // Connexion à Colyseus
      const client = new Client('ws://localhost:3001'); // URL du serveur Colyseus

      try {
        // Rejoindre ou créer une salle de matchmaking et passer l'userId
        const matchRoom = await client.joinOrCreate('matchmaking', { userId });
        setRoom(matchRoom);

        // Écouter le message lorsque la partie est trouvée
        matchRoom.onMessage('game_found', (message) => {
          setMessage('Partie trouvée, redirection vers la salle de jeu...');
          setSearching(false);
          // Rediriger le joueur vers la salle de jeu
          window.location.href = `/battle/${message.roomId}`;
        });
      } catch (error) {
        setMessage('Erreur lors de la recherche de partie.');
        setSearching(false);
        console.error(error);
      }
    } else {
      setMessage('Veuillez vous connecter pour rechercher une partie.');
    }
  };

  // Fonction pour annuler la recherche de partie
  const cancelSearch = () => {
    if (room) {
      room.leave(); // Quitter la salle de matchmaking
      setMessage('Recherche annulée.');
      setSearching(false);
    }
  };

  if (status === 'loading') {
    return <p>Chargement...</p>;
  }

  return (
    <div>
      <h1>Recherche de partie</h1>
      {searching ? (
        <>
          <p>{message}</p>
          <button onClick={cancelSearch}>Annuler la recherche</button>
        </>
      ) : (
        <>
          <button onClick={startSearch}>Rechercher une partie</button>
          <p>{message}</p>
        </>
      )}
    </div>
  );
}
