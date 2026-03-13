const rooms = {};

module.exports = {
  createRoom(roomId, socketId, playerName) {
    rooms[roomId] = {
      players: [{ id: socketId, name: playerName, isHost: true }],
      gameState: null
    };
  },

  addPlayer(roomId, socketId, playerName) {
    rooms[roomId].players.push({ id: socketId, name: playerName, isHost: false });
  },

  removePlayer(socketId) {
    for (const roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socketId);
      if (rooms[roomId].players.length === 0) delete rooms[roomId];
    }
  },

  getRoom(roomId) {
    return rooms[roomId];
  },

  getRoomOfPlayer(socketId) {
    for (const roomId in rooms) {
      if (rooms[roomId].players.find(p => p.id === socketId)) return roomId;
    }
    return null;
  }

};