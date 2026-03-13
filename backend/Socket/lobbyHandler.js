const lobbyState = require('../lobbyState');

module.exports = (io, socket) => {

  // Raum erstellen
  socket.on('create_room', ({ playerName }) => {
    const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    lobbyState.createRoom(roomId, socket.id, playerName);
    socket.join(roomId);
    socket.emit('room_created', { roomId });
    console.log(`Raum ${roomId} erstellt von ${playerName}`);
  });

  // Raum beitreten
  socket.on('join_room', ({ roomId, playerName }) => {
    const room = lobbyState.getRoom(roomId);
    if (!room) {
      socket.emit('error', { message: 'Raum nicht gefunden' });
      return;
    }
    lobbyState.addPlayer(roomId, socket.id, playerName);
    socket.join(roomId);
    io.to(roomId).emit('lobby_update', lobbyState.getRoom(roomId));
    console.log(`${playerName} ist Raum ${roomId} beigetreten`);
  });

   // Spiel starten (nur Host)
  socket.on('start_game', ({ roomId }) => {
    const room = lobbyState.getRoom(roomId);
    if (!room) return;
    const isHost = room.players[0].id === socket.id;
    if (!isHost) {
      socket.emit('error', { message: 'Nur der Host kann starten' });
      return;
    }
    if (room.players.length < 2) {
      socket.emit('error', { message: 'Mindestens 2 Spieler benötigt' });
      return;
    }
    io.to(roomId).emit('game_started');
  });

  // Disconnect
  socket.on('disconnect', () => {
    lobbyState.removePlayer(socket.id);
    console.log('Spieler getrennt:', socket.id);
  });

};