const lobbyState = require('../lobbyState');
const { initGame, placeBet, confirmBet, playerHit, playerStand, getWinners } = require('../game/blackjack');

function broadcastGameState(io, roomId, gameState) {
  const gameFinished = gameState.status === 'finished';
  const stateToSend = {
    ...gameState,
    dealer: {
      ...gameState.dealer,
      cards: gameFinished ? gameState.dealer.cards : gameState.dealer.cards.map((c, i) => i === 1 ? null : c)
    }
  };
  io.to(roomId).emit('game_state_update', stateToSend);
}

module.exports = (io, socket) => {
  socket.on('create_room', ({ playerName }) => {
    const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    lobbyState.createRoom(roomId, socket.id, playerName);
    socket.join(roomId);
    socket.emit('room_created', { roomId, playerName });
  });

  socket.on('join_room', ({ roomId, playerName }) => {
    const room = lobbyState.getRoom(roomId);
    if (!room || room.players.length >= 4 || room.gameState) {
      socket.emit('error_msg', { message: 'Beitritt nicht möglich' });
      return;
    }
    lobbyState.addPlayer(roomId, socket.id, playerName);
    socket.join(roomId);
    io.to(roomId).emit('lobby_update', { ...lobbyState.getRoom(roomId), roomId });
  });

  socket.on('start_game', ({ roomId }) => {
    const room = lobbyState.getRoom(roomId);
    if (!room || room.players[0].id !== socket.id) return;
    const gameState = initGame(room.players);
    lobbyState.setGameState(roomId, gameState);
    broadcastGameState(io, roomId, gameState);
  });

  socket.on('place_bet', ({ roomId, amount }) => {
    const room = lobbyState.getRoom(roomId);
    if (!room || !room.gameState) return;
    const updatedState = placeBet(room.gameState, socket.id, amount);
    lobbyState.setGameState(roomId, updatedState);
    broadcastGameState(io, roomId, updatedState);
  });

  // NEU: Bestätigen der Wette
  socket.on('confirm_bet', ({ roomId }) => {
    const room = lobbyState.getRoom(roomId);
    if (!room || !room.gameState) return;
    const updatedState = confirmBet(room.gameState, socket.id);
    lobbyState.setGameState(roomId, updatedState);
    broadcastGameState(io, roomId, updatedState);
  });

  socket.on('player_hit', ({ roomId }) => {
    const room = lobbyState.getRoom(roomId);
    if (!room || room.gameState.currentPlayerId !== socket.id) return;
    const updatedState = playerHit(room.gameState, socket.id);
    if (updatedState.status === 'finished') {
      const { results } = getWinners(updatedState);
      room.players.forEach(p => p.credits = updatedState.playerHands[p.id].credits);
      broadcastGameState(io, roomId, updatedState);
      io.to(roomId).emit('game_over', { results });
    } else { broadcastGameState(io, roomId, updatedState); }
  });

  socket.on('player_stand', ({ roomId }) => {
    const room = lobbyState.getRoom(roomId);
    if (!room || room.gameState.currentPlayerId !== socket.id) return;
    const updatedState = playerStand(room.gameState, socket.id);
    if (updatedState.status === 'finished') {
      const { results } = getWinners(updatedState);
      room.players.forEach(p => p.credits = updatedState.playerHands[p.id].credits);
      broadcastGameState(io, roomId, updatedState);
      io.to(roomId).emit('game_over', { results });
    } else { broadcastGameState(io, roomId, updatedState); }
  });

  socket.on('new_round', ({ roomId }) => {
    const room = lobbyState.getRoom(roomId);
    if (!room || room.players[0].id !== socket.id) return;
    const gameState = initGame(room.players);
    lobbyState.setGameState(roomId, gameState);
    broadcastGameState(io, roomId, gameState);
  });
};