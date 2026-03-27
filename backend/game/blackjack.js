

import { createAndShuffleDeck, drawCard } from './deck.js';

// --- HILFSFUNKTIONEN ---

export function calculateScore(cards) {
  let score = 0;
  let aces = 0;
  
  for (const card of cards) {
    if (card.value === 'Ace') {
      aces++;
      score += 11;
    } else if (['Jack', 'Queen', 'King'].includes(card.value)) {
      score += 10;
    } else {
      score += parseInt(card.value, 10);
    }
  }
  
  // Ass auf 1 reduzieren, wenn man sich sonst überkauft (Bust)
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  
  return score;
}

export function checkAllPlayersDone(gameState) {
  for (const playerId in gameState.playerHands) {
    if (!gameState.playerHands[playerId].isStand) {
      return false; 
    }
  }
  return true; 
}

// Wechselt zum nächsten Spieler oder zum Dealer
export function advanceTurn(gameState) {
  gameState.currentTurnIndex++; 
  
  if (gameState.currentTurnIndex < gameState.turnOrder.length) {
    // Der nächste Spieler ist dran
    gameState.currentPlayerId = gameState.turnOrder[gameState.currentTurnIndex];
  } else {
    // Alle Spieler sind durch -> Der Dealer ist automatisch an der Reihe
    dealerPlay(gameState); 
  }
}


// --- HAUPTFUNKTIONEN (API FÜR DAS SPIEL) ---

export function initGame(players, numberOfDecks = 1) {
  const deck = createAndShuffleDeck(numberOfDecks);
  const playerHands = {};

  players.forEach(player => {
    const cards = [drawCard(deck), drawCard(deck)];
    const score = calculateScore(cards);

    playerHands[player.id] = {
      name: player.name,
      cards: cards,
      score: score,
      isBust: false,
      isStand: false,
      hasBlackjack: score === 21 
    };
  });
  
  const dealerCards = [drawCard(deck), drawCard(deck)];
  const dealerScore = calculateScore(dealerCards);

  const dealer = {
    name: "Dealer",
    cards: dealerCards,
    score: dealerScore,
    isBust: false,
    hasBlackjack: dealerScore === 21
  };
  
  const turnOrder = players.map(player => player.id);

  return { 
    deck, 
    playerHands, 
    dealer,
    status: 'playing',
    turnOrder: turnOrder,             
    currentTurnIndex: 0,              
    currentPlayerId: turnOrder.length > 0 ? turnOrder[0] : null     
  };
}

export function playerHit(gameState, playerId) {
  // Check: Ist der Spieler dran?
  if (gameState.currentPlayerId !== playerId) return gameState; 

  const player = gameState.playerHands[playerId];

  // Check: Darf er noch ziehen?
  if (player.isStand || player.isBust) return gameState; 

  // Karte ziehen
  const card = drawCard(gameState.deck);
  player.cards.push(card);
  player.score = calculateScore(player.cards);
  
  // Auto-Bust oder 21 erreicht -> Zug automatisch beenden
  if (player.score >= 21) {
    if (player.score > 21) player.isBust = true;
    player.isStand = true; 
    advanceTurn(gameState);
  }
  
  return gameState;
}

export function playerStand(gameState, playerId) {
  // Check: Ist der Spieler dran?
  if (gameState.currentPlayerId !== playerId) return gameState;

  gameState.playerHands[playerId].isStand = true;
  advanceTurn(gameState);
  
  return gameState;
}

export function dealerPlay(gameState) {
  gameState.status = 'dealerTurn'; 
  gameState.currentPlayerId = 'dealer'; 

  while (gameState.dealer.score < 17) {
    const card = drawCard(gameState.deck);
    gameState.dealer.cards.push(card);
    gameState.dealer.score = calculateScore(gameState.dealer.cards);
  }
  
  if (gameState.dealer.score > 21) {
    gameState.dealer.isBust = true;
  }
  
  gameState.status = 'finished'; 
  return gameState;
}

export function getWinners(gameState) {
  const results = {};
  const dealer = gameState.dealer;
  
  for (const playerId in gameState.playerHands) {
    const player = gameState.playerHands[playerId];
    
    if (player.isBust) {
      results[playerId] = 'loss';
    } else if (player.hasBlackjack && !dealer.hasBlackjack) {
      results[playerId] = 'blackjack'; 
    } else if (dealer.hasBlackjack && !player.hasBlackjack) {
       results[playerId] = 'loss';
    } else if (dealer.isBust) {
      results[playerId] = 'win';
    } else if (player.score > dealer.score) {
      results[playerId] = 'win';
    } else if (player.score === dealer.score) {
      results[playerId] = 'push'; 
    } else {
      results[playerId] = 'loss';
    }
  }
  
  return results;
}