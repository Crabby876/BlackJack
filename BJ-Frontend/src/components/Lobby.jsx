import { useEffect, useState, useRef } from 'react';
import { socket } from '../socket';

// ────────────────────────────────────────────────────────────────────────────
// Lobby.jsx — Der Warteraum
//
// Zeigt:
// - Links:  Spielerliste (bis zu 4 Plätze)
// - Mitte:  Lobby-ID + Einstellungen (Platzhalter) + Buttons
// - Rechts: Chat
//
// Wichtig: Wenn der Host "Start" drückt, sendet der Server game_state_update.
// Wir fangen das hier ab und wechseln zur Game-Ansicht.
// ────────────────────────────────────────────────────────────────────────────

export default function Lobby({ lobbyData, onGameStart }) {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [players, setPlayers] = useState(lobbyData.initialPlayers || []);
  const chatEndRef = useRef(null);

  const isHost = lobbyData.isHost;
  const roomId = lobbyData.lobbyId;

  // Auto-scroll Chat nach unten bei neuen Nachrichten
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(function () {
    // ── Chat-Nachricht empfangen ──
    function handleReceiveMessage(newMessage) {
      setMessages(function (prev) {
        return [...prev, newMessage];
      });
    }

    // ── Lobby-Update (Spieler beigetreten/verlassen) ──
    function handleLobbyUpdate(roomData) {
      const playerNames = roomData.players.map(function (player) {
        return player.name || player.playerName || player;
      });
      setPlayers(playerNames);
    }

    // ── Spiel startet: game_state_update kommt ──
    // Das ist das Signal, dass initGame() aufgerufen wurde.
    // Wir geben den gameState direkt an die Game-Komponente weiter,
    // damit sie sofort Karten anzeigen kann (kein Ladescreen nötig).
    function handleGameStateUpdate(state) {
      onGameStart({
        ...lobbyData,
        isHost: isHost,
        initialGameState: state,
      });
    }

    socket.on('receive_message', handleReceiveMessage);
    socket.on('lobby_update', handleLobbyUpdate);
    socket.on('game_state_update', handleGameStateUpdate);

    return function cleanup() {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('lobby_update', handleLobbyUpdate);
      socket.off('game_state_update', handleGameStateUpdate);
    };
  }, [lobbyData, isHost, onGameStart]);

  function sendMessage() {
    if (currentMessage.trim() !== '') {
      socket.emit('send_message', {
        lobbyId: roomId,
        text: lobbyData.playerName + ': ' + currentMessage,
      });
      setCurrentMessage('');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') sendMessage();
  }

  function copyLink() {
    const shareLink = window.location.origin + '?lobby=' + roomId;
    navigator.clipboard.writeText(shareLink);
    alert('Link kopiert: ' + shareLink);
  }

  function startGame() {
    socket.emit('start_game', { roomId });
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background:
          'radial-gradient(ellipse at 50% 40%, #1a6b52 0%, #0A3628 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
      }}
    >
      {/* Tischrand-Oval */}
      <div
        style={{
          position: 'fixed',
          top: '6%',
          left: '8%',
          right: '8%',
          bottom: '6%',
          border: '2px solid #D4AF3733',
          borderRadius: '50% / 40%',
          pointerEvents: 'none',
        }}
      />

      {/* ── Hauptcontainer ── */}
      <div
        style={{
          display: 'flex',
          width: '720px',
          height: '480px',
          background: 'rgba(10, 54, 40, 0.92)',
          border: '2px solid #D4AF37',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ══ LINKS: Spielerliste ══ */}
        <div
          style={{
            width: '200px',
            borderRight: '1px solid #D4AF3744',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              color: '#D4AF37',
              fontSize: '11px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            Spieler
          </div>

          {/* 4 Slots anzeigen */}
          {[0, 1, 2, 3].map(function (i) {
            const name = players[i];
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: name
                    ? 'rgba(212,175,55,0.1)'
                    : 'rgba(255,255,255,0.03)',
                  border:
                    '1px solid ' + (name ? '#D4AF3766' : '#D4AF3722'),
                  borderRadius: '6px',
                  color: name ? '#F5F5DC' : '#F5F5DC33',
                  fontSize: '14px',
                }}
              >
                <span>{name || 'Spieler ' + (i + 1)}</span>
                {name && i === 0 && (
                  <span style={{ color: '#D4AF37', fontSize: '11px' }}>
                    Host
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ══ MITTE: Lobby-Info + Buttons ══ */}
        <div
          style={{
            flex: 1,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                color: '#D4AF37',
                fontSize: '11px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                marginBottom: '16px',
              }}
            >
              Lobby: {roomId}
            </div>
            <div
              style={{
                color: '#F5F5DC44',
                fontSize: '13px',
                textAlign: 'center',
                marginTop: '40px',
              }}
            >
              Settings
            </div>
          </div>

          {/* Buttons unten */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={copyLink}
              style={{
                flex: 1,
                padding: '12px 0',
                background: '#D4AF37',
                color: '#0A3628',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 'bold',
                fontFamily: 'Georgia, serif',
                cursor: 'pointer',
                letterSpacing: '1px',
              }}
            >
              Invite
            </button>

            {isHost ? (
              <button
                onClick={startGame}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background:
                    players.length >= 1 ? '#22c55e' : '#22c55e66',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  fontFamily: 'Georgia, serif',
                  cursor: players.length >= 1 ? 'pointer' : 'not-allowed',
                  letterSpacing: '1px',
                }}
              >
                Start
              </button>
            ) : (
              <div
                style={{
                  flex: 1,
                  padding: '12px 0',
                  textAlign: 'center',
                  color: '#F5F5DC55',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Warte auf Host...
              </div>
            )}
          </div>
        </div>

        {/* ══ RECHTS: Chat ══ */}
        <div
          style={{
            width: '200px',
            borderLeft: '1px solid #D4AF3744',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          {/* Chat-Label */}
          <div
            style={{
              padding: '12px 12px 0',
              color: '#D4AF37',
              fontSize: '11px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            Chat
          </div>

          {/* Nachrichten */}
          <div
            style={{
              flex: 1,
              padding: '8px 12px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  color: '#F5F5DC33',
                  fontSize: '12px',
                  textAlign: 'center',
                  marginTop: '20px',
                }}
              >
                Noch keine Nachrichten
              </div>
            )}
            {messages.map(function (msg, i) {
              return (
                <div
                  key={i}
                  style={{
                    color: '#F5F5DC',
                    fontSize: '12px',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.text}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat-Eingabe */}
          <div style={{ borderTop: '1px solid #D4AF3744', padding: '10px' }}>
            <input
              value={currentMessage}
              onChange={function (e) {
                setCurrentMessage(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Chat..."
              style={{
                width: '100%',
                padding: '8px 10px',
                background: '#F5F5DC',
                border: '1px solid #D4AF3766',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'Georgia, serif',
                color: '#0A3628',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
