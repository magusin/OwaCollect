import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Client } from 'colyseus.js';
import { useSession } from 'next-auth/react';

export default function GameRoom() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [players, setPlayers] = useState([]);
  const [isWaiting, setIsWaiting] = useState(false); // État pour gérer l'attente du joueur
  const router = useRouter();
  const { roomId } = router.query;
  const { data: session } = useSession();
  const client = new Client('ws://localhost:2567');
  let room;

  useEffect(() => {
    if (!roomId) return;

    async function joinRoom() {
      try {
        const userId = session?.user?.id || 'anonymous';
        console.log(`Attempting to join room with ID: ${roomId}`);
        room = await client.joinById(roomId, { userId });

        room.onMessage('message', (msg) => {
          setMessages((prev) => [...prev, msg]);
        });

        room.onMessage('players', (data) => {
          setPlayers(data.players);
          setIsWaiting(data.players.length < 2); // Vérifier si les deux joueurs sont présents
        });

        console.log('Successfully joined room:', room);
      } catch (error) {
        console.error('Error joining room:', error);
      }
    }

    joinRoom();

    // Cleanup function to leave the room when the component is unmounted
    return () => {
      if (room) {
        room.leave();
      }
    };
  }, [roomId, session]);

  const sendMessage = () => {
    if (room) {
      room.send('message', message);
      setMessage('');
    }
  };

  return (
    <div>
      <h1>Partie {roomId}</h1>
      {isWaiting ? (
        <p>En attente d'un autre joueur...</p>
      ) : (
        <div>
          <h2>Joueurs présents :</h2>
          <ul>
            {players.map((player, index) => (
              <li key={index}>{player}</li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Envoyer un message"
        />
        <button onClick={sendMessage}>Envoyer</button>
      </div>
      <div>
        <h2>Messages :</h2>
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
    </div>
  );
}
