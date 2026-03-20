const suits = ["Hearts", "Diamonds", "Spades", "Clubs"];
const values = [
  "2", "3", "4", "5", "6", "7", "8", "9", "10", 
  "Jack", "Queen", "King", "Ace"
];
export const createAndShuffleDeck = (numberOfDecks = 1) => {
  let fullDeck = [];

  //  Karten generieren (Mehrere Kartensätze)
  for (let d = 0; d < numberOfDecks; d++) {
    for (let suit of suits) {
      for (let value of values) {
        fullDeck.push({ 
          suit, 
          value, 
          id: `${d}-${suit}-${value}`
        });
      }
    }
  }

  //  Mischen des Sets (Fisher-Yates Algorithmus)
  for (let i = fullDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
  }

  return fullDeck;
};

// Zieht die oberste Karte vom Stapel
export const drawCard = (deck) => {
  return deck.pop(); 
};