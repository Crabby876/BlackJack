// ────────────────────────────────────────────────────────────────────────────
// lobbyState.js
// ────────────────────────────────────────────────────────────────────────────

const rooms = {};

module.exports = {
  createRoom(roomId, socketId, playerName) {
    rooms[roomId] = {
      // Host bekommt initial 1000 Credits
      players: [{ id: socketId, name: playerName, isHost: true, credits: 1000 }],
      gameState: null
    };
  },

  addPlayer(roomId, socketId, playerName) {
    if (!rooms[roomId]) return;
    // Neue Spieler bekommen initial 1000 Credits
    rooms[roomId].players.push({ id: socketId, name: playerName, isHost: false, credits: 1000 });
  },

  removePlayer(socketId) {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const index = room.players.findIndex(p => p.id === socketId);

      if (index !== -1) {
        room.players.splice(index, 1);

        if (room.players.length === 0) {
          delete rooms[roomId];
        } else if (index === 0) {
          room.players[0].isHost = true;
        }
      }
    }
  },

  setGameState(roomId, gameState) {
    if (rooms[roomId]) {
      rooms[roomId].gameState = gameState;
    }
  },

  getRoom(roomId) {
    return rooms[roomId];
  },

  getRoomOfPlayer(socketId) {
    for (const roomId in rooms) {
      if (rooms[roomId].players.find(p => p.id === socketId)) {
        return roomId;
      }
    }
    return null;
  }
};