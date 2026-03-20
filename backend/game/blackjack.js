const { createAndShuffleDeck, drawCard } = require('./deck'); 

// Ace = 11 or 1 depending on situation
function calculateScore(cards) {
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
  
  // Reduce Ace value to 1 if score is over 21
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  
  return score;
}

// Initialize game - all players + dealer get 2 cards
function initGame(players, numberOfDecks = 1) {
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
  
  return { 
    deck, 
    playerHands, 
    dealer,
    status: 'playing' 
  };
}

// Player draws a card (Hit)
function playerHit(gameState, playerId) {
  if (gameState.playerHands[playerId].isStand || gameState.playerHands[playerId].isBust) {
    return gameState; 
  }

  const card = drawCard(gameState.deck);
  gameState.playerHands[playerId].cards.push(card);
  gameState.playerHands[playerId].score = calculateScore(gameState.playerHands[playerId].cards);
  
  if (gameState.playerHands[playerId].score > 21) {
    gameState.playerHands[playerId].isBust = true;
    gameState.playerHands[playerId].isStand = true; 
  }
  
  return gameState;
}

// Player stands
function playerStand(gameState, playerId) {
  gameState.playerHands[playerId].isStand = true;
  return gameState;
}

// Check if all players are done (Bust or Stand)
function checkAllPlayersDone(gameState) {
  for (const playerId in gameState.playerHands) {
    if (!gameState.playerHands[playerId].isStand) {
      return false; 
    }
  }
  return true; 
}

// Dealer draws until 17
function dealerPlay(gameState) {
  gameState.status = 'dealerTurn'; 

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

// Determine winners using standard English casino terms
function getWinners(gameState) {
  const results = {};
  const dealer = gameState.dealer;
  
  for (const playerId in gameState.playerHands) {
    const player = gameState.playerHands[playerId];
    
    if (player.isBust) {
      results[playerId] = 'loss';
    } else if (player.hasBlackjack && !dealer.hasBlackjack) {
      results[playerId] = 'blackjack'; // Pays 3:2 normally
    } else if (dealer.hasBlackjack && !player.hasBlackjack) {
       results[playerId] = 'loss';
    } else if (dealer.isBust) {
      results[playerId] = 'win';
    } else if (player.score > dealer.score) {
      results[playerId] = 'win';
    } else if (player.score === dealer.score) {
      results[playerId] = 'push'; // Standard term for tie
    } else {
      results[playerId] = 'loss';
    }
  }
  
  return results;
}

module.exports = { 
  initGame, 
  playerHit, 
  playerStand, 
  checkAllPlayersDone, 
  dealerPlay, 
  getWinners, 
  calculateScore 
};