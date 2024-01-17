const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const duels = {}; // Stocke l'état des duels

wss.on('connection', (ws, req) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    switch (data.type) {
      case 'JOIN_DUEL':
        if (!duels[data.duelId]) {
          duels[data.duelId] = { player1: ws, player2: null };
        } else {
          duels[data.duelId].player2 = ws;
        }
        break;

      // Ajoutez d'autres cas en fonction de vos besoins
    }
  });

  ws.on('close', () => {
    // Gérer la déconnexion d'un joueur
  });
});

console.log('WebSocket server started on ws://localhost:8080');