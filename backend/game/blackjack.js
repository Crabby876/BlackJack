const { createAndShuffleDeck, drawCard } = require('./deck.js');

function calculateScore(cards) {
  let score = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.value === 'Ace') { aces++; score += 11; }
    else if (['Jack', 'Queen', 'King'].includes(card.value)) { score += 10; }
    else { score += parseInt(card.value, 10); }
  }
  while (score > 21 && aces > 0) { score -= 10; aces--; }
  return score;
}

function initGame(players, numberOfDecks = 1) {
  const deck = createAndShuffleDeck(numberOfDecks);
  const playerHands = {};

  players.forEach(player => {
    playerHands[player.id] = {
      name: player.name,
      credits: player.credits, 
      bet: 0,
      betConfirmed: false, // Neu: Status für Bestätigung
      cards: [],
      score: 0,
      isBust: false,
      isStand: false,
      hasBlackjack: false 
    };
  });
  
  return { 
    deck, 
    playerHands, 
    dealer: { name: "Dealer", cards: [], score: 0, isBust: false, hasBlackjack: false },
    status: 'betting', 
    turnOrder: players.map(p => p.id),             
    currentTurnIndex: 0,              
    currentPlayerId: null     
  };
}

// Erlaubt mehrfaches Klicken zum Erhöhen des Einsatzes
function placeBet(gameState, playerId, amount) {
  const player = gameState.playerHands[playerId];
  if (gameState.status !== 'betting' || player.betConfirmed || player.credits < amount) {
    return gameState;
  }
  player.bet += amount;
  player.credits -= amount;
  return gameState;
}

// Spieler bestätigt seinen Gesamteinsatz
function confirmBet(gameState, playerId) {
  const player = gameState.playerHands[playerId];
  if (gameState.status !== 'betting' || player.bet <= 0) return gameState;
  
  player.betConfirmed = true;

  // Prüfen ob alle Spieler bestätigt haben
  const allConfirmed = Object.values(gameState.playerHands).every(p => p.betConfirmed);
  if (allConfirmed) {
     dealInitialCards(gameState);
  }
  return gameState;
}

function dealInitialCards(gameState) {
  for (const playerId in gameState.playerHands) {
    const player = gameState.playerHands[playerId];
    player.cards = [drawCard(gameState.deck), drawCard(gameState.deck)];
    player.score = calculateScore(player.cards);
    player.hasBlackjack = player.score === 21;
  }
  gameState.dealer.cards = [drawCard(gameState.deck), drawCard(gameState.deck)];
  gameState.dealer.score = calculateScore(gameState.dealer.cards);
  gameState.dealer.hasBlackjack = gameState.dealer.score === 21;
  gameState.status = 'playing';
  gameState.currentPlayerId = gameState.turnOrder[0];
}

function playerHit(gameState, playerId) {
  if (gameState.currentPlayerId !== playerId || gameState.status !== 'playing') return gameState; 
  const player = gameState.playerHands[playerId];
  const card = drawCard(gameState.deck);
  player.cards.push(card);
  player.score = calculateScore(player.cards);
  if (player.score >= 21) {
    if (player.score > 21) player.isBust = true;
    player.isStand = true; 
    advanceTurn(gameState);
  }
  return gameState;
}

function playerStand(gameState, playerId) {
  if (gameState.currentPlayerId !== playerId || gameState.status !== 'playing') return gameState;
  gameState.playerHands[playerId].isStand = true;
  advanceTurn(gameState);
  return gameState;
}

function advanceTurn(gameState) {
  gameState.currentTurnIndex++; 
  if (gameState.currentTurnIndex < gameState.turnOrder.length) {
    gameState.currentPlayerId = gameState.turnOrder[gameState.currentTurnIndex];
    const p = gameState.playerHands[gameState.currentPlayerId];
    if (p.score >= 21) { p.isStand = true; advanceTurn(gameState); }
  } else { dealerPlay(gameState); }
}

function dealerPlay(gameState) {
  gameState.status = 'dealerTurn'; 
  while (gameState.dealer.score < 17) {
    gameState.dealer.cards.push(drawCard(gameState.deck));
    gameState.dealer.score = calculateScore(gameState.dealer.cards);
  }
  if (gameState.dealer.score > 21) gameState.dealer.isBust = true;
  gameState.status = 'finished'; 
  return gameState;
}

function getWinners(gameState) {
  const results = {};
  const payouts = {};
  const dealer = gameState.dealer;
  for (const playerId in gameState.playerHands) {
    const player = gameState.playerHands[playerId];
    let outcome = 'loss';
    let payout = 0;
    if (!player.isBust) {
      if (player.hasBlackjack && !dealer.hasBlackjack) { outcome = 'blackjack'; payout = player.bet * 2.5; }
      else if (dealer.hasBlackjack && !player.hasBlackjack) { outcome = 'loss'; }
      else if (dealer.isBust || player.score > dealer.score) { outcome = 'win'; payout = player.bet * 2; }
      else if (player.score === dealer.score) { outcome = 'push'; payout = player.bet; }
    }
    results[playerId] = outcome;
    payouts[playerId] = payout;
    player.credits += payout;
  }
  return { results, payouts };
}

module.exports = { initGame, placeBet, confirmBet, playerHit, playerStand, getWinners };