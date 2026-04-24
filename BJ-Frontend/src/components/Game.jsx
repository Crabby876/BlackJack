import { useEffect, useState } from 'react';
import { socket } from '../socket';

// ────────────────────────────────────────────────────────────────────────────
// KARTENDARSTELLUNG
// ────────────────────────────────────────────────────────────────────────────

function getCardDisplay(card) {
  if (!card) return { label: '?', suit: '?', color: '#F5F5DC', hidden: true };

  const suitSymbols = {
    Hearts: '♥',
    Diamonds: '♦',
    Spades: '♠',
    Clubs: '♣',
  };
  const redSuits = ['Hearts', 'Diamonds'];

  return {
    label: card.value,
    suit: suitSymbols[card.suit] || card.suit,
    color: redSuits.includes(card.suit) ? '#8B0000' : '#0A3628',
    hidden: false,
  };
}

function Card({ card, rotated = false }) {
  const display = getCardDisplay(card);

  if (display.hidden) {
    return (
      <div
        style={{
          width: '70px',
          height: '100px',
          borderRadius: '8px',
          background:
            'repeating-linear-gradient(45deg, #0A3628, #0A3628 5px, #0F4C3A 5px, #0F4C3A 10px)',
          border: '2px solid #D4AF37',
          display: 'inline-block',
          transform: rotated ? 'rotate(-5deg)' : 'none',
          boxShadow: '2px 4px 12px rgba(0,0,0,0.5)',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: '70px',
        height: '100px',
        borderRadius: '8px',
        background: '#F5F5DC',
        border: '2px solid #D4AF37',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '6px',
        transform: rotated ? 'rotate(-5deg)' : 'none',
        boxShadow: '2px 4px 12px rgba(0,0,0,0.5)',
        flexShrink: 0,
        color: display.color,
        fontFamily: 'Georgia, serif',
        fontWeight: 'bold',
      }}
    >
      <div style={{ fontSize: '14px', lineHeight: 1 }}>
        <div>{display.label}</div>
        <div>{display.suit}</div>
      </div>
      <div style={{ fontSize: '22px', textAlign: 'center' }}>
        {display.suit}
      </div>
      <div
        style={{
          fontSize: '14px',
          lineHeight: 1,
          transform: 'rotate(180deg)',
          alignSelf: 'flex-end',
        }}
      >
        <div>{display.label}</div>
        <div>{display.suit}</div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Status-Nachricht berechnen
// ────────────────────────────────────────────────────────────────────────────

function calcStatusMsg(state, myId) {
  if (!state) return 'Warte auf Spielstart...';
  
  if (state.status === 'betting') {
    const myHand = state.playerHands[myId];
    if (myHand && myHand.betConfirmed) return 'Warte auf Mitspieler...';
    return 'Bitte Einsatz wählen!';
  }
  
  if (state.status === 'finished') return 'Runde beendet!';
  if (state.currentPlayerId === myId) return 'Du bist dran!';
  if (state.currentPlayerId === 'dealer') return 'Dealer zieht...';

  const currentHand = state.playerHands[state.currentPlayerId];
  const name = currentHand ? currentHand.name : 'Jemand';
  return name + ' ist dran...';
}

// ────────────────────────────────────────────────────────────────────────────
// GAME-KOMPONENTE
// ────────────────────────────────────────────────────────────────────────────

export default function Game({ lobbyData }) {
  const myId = socket.id;
  const isHost = lobbyData.isHost;
  const roomId = lobbyData.lobbyId;

  const initial = lobbyData.initialGameState || null;
  const [gameState, setGameState] = useState(initial);
  const [results, setResults] = useState(null);
  const [statusMsg, setStatusMsg] = useState(calcStatusMsg(initial, myId));

  useEffect(() => {
    function handleGameStateUpdate(state) {
      setGameState(state);
      setResults(null);
      setStatusMsg(calcStatusMsg(state, myId));
    }

    function handleGameOver({ results: res }) {
      setResults(res);
      setStatusMsg('Runde beendet!');
    }

    socket.on('game_state_update', handleGameStateUpdate);
    socket.on('game_over', handleGameOver);

    return () => {
      socket.off('game_state_update', handleGameStateUpdate);
      socket.off('game_over', handleGameOver);
    };
  }, [myId]);

  // ── Aktionen ──
  function handleBet(amount) {
    socket.emit('place_bet', { roomId, amount });
  }

  function handleConfirmBet() {
    socket.emit('confirm_bet', { roomId });
  }

  function handleHit() {
    socket.emit('player_hit', { roomId });
  }

  function handleStand() {
    socket.emit('player_stand', { roomId });
  }

  function handleNewRound() {
    socket.emit('new_round', { roomId });
  }

  if (!gameState) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#0F4C3A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#D4AF37',
          fontFamily: 'Georgia, serif',
          fontSize: '24px',
        }}
      >
        Karten werden ausgeteilt...
      </div>
    );
  }

  const myHand = gameState.playerHands[myId];
  const dealer = gameState.dealer;
  const isMyTurn = gameState.currentPlayerId === myId && gameState.status === 'playing';
  const gameFinished = gameState.status === 'finished';
  const isBetting = gameState.status === 'betting';

  const otherPlayers = Object.entries(gameState.playerHands).filter(
    ([id]) => id !== myId
  );

  function getResultText() {
    if (!results || !results[myId]) return '';
    const map = { win: 'Gewonnen!', loss: 'Verloren', push: 'Unentschieden', blackjack: 'BLACKJACK!' };
    return map[results[myId]] || '';
  }

  function getResultColor() {
    if (!results || !results[myId]) return '#F5F5DC';
    const map = { win: '#D4AF37', loss: '#8B0000', push: '#aaa', blackjack: '#D4AF37' };
    return map[results[myId]] || '#F5F5DC';
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0F4C3A',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 40%, #1a6b52 0%, #0A3628 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '6%', left: '8%', right: '8%', bottom: '6%',
          border: '3px solid #D4AF3744',
          borderRadius: '50% / 40%',
          pointerEvents: 'none',
        }}
      />

      {/* ══ LINKS OBEN: Mitspieler-Liste ══ */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 10 }}>
        {otherPlayers.map(([id, hand]) => {
          const isTheirTurn = gameState.currentPlayerId === id && !isBetting;
          const res = results && results[id];
          return (
            <div key={id} style={{ background: isTheirTurn ? 'rgba(212,175,55,0.25)' : 'rgba(10,54,40,0.85)', border: `1px solid ${isTheirTurn ? '#D4AF37' : '#D4AF3755'}`, borderRadius: '6px', padding: '6px 12px', color: '#F5F5DC', fontSize: '13px', minWidth: '150px' }}>
              <div style={{ fontWeight: 'bold', color: isTheirTurn ? '#D4AF37' : '#F5F5DC' }}>
                {hand.name} {isTheirTurn ? '◀' : ''}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                {isBetting ? (
                  <span>{hand.betConfirmed ? `Bereit (Einsatz: ${hand.bet})` : 'Wählt Einsatz...'}</span>
                ) : (
                  <span>Score: {hand.score} {hand.isBust && '— Bust'} {hand.isStand && !hand.isBust && '— Stand'}</span>
                )}
              </div>
              {res && (
                <div style={{ fontSize: '12px', color: res === 'win' || res === 'blackjack' ? '#D4AF37' : res === 'push' ? '#aaa' : '#8B0000', fontWeight: 'bold' }}>
                  {res === 'win' ? 'Gewonnen' : res === 'loss' ? 'Verloren' : res === 'push' ? 'Unentschieden' : 'BLACKJACK!'}
                </div>
              )}
              {!isBetting && (
                <div style={{ display: 'flex', gap: '3px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {hand.cards.map((card, i) => (
                    <div key={i} style={{ width: '28px', height: '40px', background: '#F5F5DC', border: '1px solid #D4AF37', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', color: ['Hearts', 'Diamonds'].includes(card?.suit) ? '#8B0000' : '#0A3628' }}>
                      {card ? card.value[0] + (card.suit === 'Hearts' ? '♥' : card.suit === 'Diamonds' ? '♦' : card.suit === 'Spades' ? '♠' : '♣') : '?'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ══ OBEN MITTE: Dealer ══ */}
      <div style={{ position: 'absolute', top: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 10 }}>
        <div style={{ color: '#D4AF37', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.85 }}>
          Dealer {gameFinished ? `— ${dealer.score}` : (!isBetting && dealer.cards[0]) ? `(${dealer.cards[0].value})` : ''} {dealer.isBust && '— Bust'}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {dealer.cards.map((card, i) => (
            <Card key={i} card={card} rotated={i === 1 && !gameFinished && !card} />
          ))}
        </div>
      </div>

      {/* ══ MITTE: Status & Wett-Chips ══ */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', zIndex: 10 }}>
        
        {/* Status-Text (nur anzeigen, wenn man NICHT gerade wettet oder fertig ist) */}
        {(!isBetting || (isBetting && myHand?.betConfirmed)) && (
          <div style={{ color: '#F5F5DC', fontSize: '16px', background: 'rgba(10,54,40,0.8)', padding: '6px 20px', borderRadius: '20px', border: '1px solid #D4AF3755' }}>
            {statusMsg}
          </div>
        )}

        {/* Wett-UI */}
        {isBetting && myHand && !myHand.betConfirmed && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', background: 'rgba(10,54,40,0.9)', padding: '24px', borderRadius: '16px', border: '2px solid #D4AF37', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <div style={{ color: '#F5F5DC', fontSize: '18px', fontWeight: 'bold' }}>Einsatz festlegen</div>
            <div style={{ fontSize: '24px', color: '#D4AF37', fontWeight: 'bold' }}>{myHand.bet}</div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              {[10, 50, 100].map(amount => {
                const canAfford = myHand.credits >= amount;
                return (
                  <button
                    key={amount}
                    onClick={() => handleBet(amount)}
                    disabled={!canAfford}
                    style={{
                      width: '64px', height: '64px', borderRadius: '50%', cursor: canAfford ? 'pointer' : 'not-allowed',
                      background: `conic-gradient(#D4AF37 0deg 30deg, ${canAfford ? '#8B0000' : '#333'} 30deg 60deg, #D4AF37 60deg 90deg, ${canAfford ? '#8B0000' : '#333'} 90deg 120deg, #D4AF37 120deg 150deg, ${canAfford ? '#8B0000' : '#333'} 150deg 180deg, #D4AF37 180deg 210deg, ${canAfford ? '#8B0000' : '#333'} 210deg 240deg, #D4AF37 240deg 270deg, ${canAfford ? '#8B0000' : '#333'} 270deg 300deg, #D4AF37 300deg 330deg, ${canAfford ? '#8B0000' : '#333'} 330deg 360deg)`,
                      border: '3px solid #F5F5DC', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', opacity: canAfford ? 1 : 0.5
                    }}
                  >
                    <div style={{ background: canAfford ? '#8B0000' : '#333', width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #F5F5DC', color: '#F5F5DC', fontSize: '14px', fontWeight: 'bold' }}>
                      {amount}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={handleConfirmBet}
              disabled={myHand.bet === 0}
              style={{ padding: '12px 24px', background: myHand.bet > 0 ? '#D4AF37' : '#D4AF3755', color: '#0A3628', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', fontFamily: 'Georgia, serif', cursor: myHand.bet > 0 ? 'pointer' : 'not-allowed' }}
            >
              Bestätigen
            </button>
          </div>
        )}

        {/* Ergebnis-Banner */}
        {results && results[myId] && (
          <div style={{ color: getResultColor(), fontSize: '32px', fontWeight: 'bold', textShadow: '0 2px 8px rgba(0,0,0,0.7)', letterSpacing: '2px', animation: 'fadeIn 0.3s ease-in' }}>
            {getResultText()}
          </div>
        )}
      </div>

      {/* ══ UNTEN MITTE: Eigene Karten ══ */}
      {myHand && !isBetting && (
        <div style={{ position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {myHand.cards.map((card, i) => (
              <Card key={i} card={card} rotated={i % 2 === 1} />
            ))}
          </div>
          <div style={{ color: myHand.isBust ? '#8B0000' : '#D4AF37', fontSize: '16px', fontWeight: 'bold', background: 'rgba(10,54,40,0.8)', padding: '4px 12px', borderRadius: '8px' }}>
            {myHand.name} — Score: {myHand.score} {myHand.isBust && '— BUST'} {myHand.hasBlackjack && '— BLACKJACK!'}
          </div>
        </div>
      )}

      {/* ══ RECHTS: Hit / Stand / Neue Runde ══ */}
      <div style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 10 }}>
        <button onClick={handleHit} disabled={!isMyTurn || gameFinished} style={{ width: '110px', padding: '14px 0', background: isMyTurn && !gameFinished ? '#D4AF37' : '#D4AF3744', color: isMyTurn && !gameFinished ? '#0A3628' : '#D4AF3788', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', fontFamily: 'Georgia, serif', cursor: isMyTurn && !gameFinished ? 'pointer' : 'not-allowed', boxShadow: isMyTurn && !gameFinished ? '0 4px 12px rgba(212,175,55,0.4)' : 'none' }}>
          Hit
        </button>
        <button onClick={handleStand} disabled={!isMyTurn || gameFinished} style={{ width: '110px', padding: '14px 0', background: isMyTurn && !gameFinished ? '#F5F5DC' : '#F5F5DC44', color: isMyTurn && !gameFinished ? '#0A3628' : '#F5F5DC88', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', fontFamily: 'Georgia, serif', cursor: isMyTurn && !gameFinished ? 'pointer' : 'not-allowed', boxShadow: isMyTurn && !gameFinished ? '0 4px 12px rgba(245,245,220,0.2)' : 'none' }}>
          Stand
        </button>
        
        {gameFinished && isHost && (
          <button onClick={handleNewRound} style={{ width: '110px', padding: '14px 0', background: '#8B0000', color: '#F5F5DC', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', fontFamily: 'Georgia, serif', cursor: 'pointer', marginTop: '8px' }}>
            Neue Runde
          </button>
        )}
      </div>

      {/* ══ UNTEN LINKS: Credits & Einsatz ══ */}
      {myHand && (
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(10,54,40,0.9)', border: '1px solid #D4AF37', borderRadius: '8px', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10 }}>
          <div style={{ color: '#D4AF37', fontSize: '16px', fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>
            Geld: {myHand.credits}
          </div>
          {myHand.bet > 0 && (
            <div style={{ color: '#F5F5DC', fontSize: '13px', fontFamily: 'Georgia, serif' }}>
              Einsatz: {myHand.bet}
            </div>
          )}
        </div>
      )}
    </div>
  );
}