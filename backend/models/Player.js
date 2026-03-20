
class Player {

  constructor(id, name) {
    // Lobby-Daten 
    this.id = id;
    this.name = name;
    this.roomId = null;       
    this.isReady = false;     

    //  In-Game Daten 
    this.hand = [];           // Die aktuellen Karten auf der Hand
    this.score = 0;           // Der aktuelle Punktestand
    this.status = "waiting";  // "waiting", "playing", "stand", "bust"
  }
  
  //Setzt den Spieler für eine neue Runde Blackjack zurück
  resetForNewRound() {
    this.hand = [];
    this.score = 0;
    this.status = "playing";
  }

  receiveCard(card) {
    this.hand.push(card);
  }
}

// Exportieren der Klasse, damit andere Dateien sie nutzen können
export default Player; 
// Falls ihr noch CommonJS nutzt (require), nimm stattdessen: 
// module.exports = Player;
