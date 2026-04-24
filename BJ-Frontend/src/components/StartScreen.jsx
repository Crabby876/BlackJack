import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';

// ────────────────────────────────────────────────────────────────────────────
// StartScreen.jsx — Der erste Bildschirm
//
// Hier gibt der Spieler seinen Namen ein und kann:
// 1. Eine neue Lobby erstellen (create_room)
// 2. Einer bestehenden Lobby beitreten (join_room) via LobbyID oder Link
//
// WICHTIGER FIX: useRef für playerName
// ──────────────────────────────────────
// Problem: useEffect registriert Event-Handler. Diese Handler "fangen"
// den Wert von playerName zum Zeitpunkt der Registrierung ein (Closure).
// Da playerName anfangs '' ist, wird '' an onJoin übergeben.
//
// Lösung: Ein useRef, das immer den aktuellen Wert hat.
// refs werden NICHT von Closures eingefroren.
// ────────────────────────────────────────────────────────────────────────────

export default function StartScreen({ onJoin }) {
  const [playerName, setPlayerName] = useState('');
  const [lobbyId, setLobbyId] = useState('');
  const [error, setError] = useState('');

  // Ref hält immer den aktuellen playerName-Wert
  const playerNameRef = useRef(playerName);
  playerNameRef.current = playerName;

  // Ref für lobbyId (gleicher Grund)
  const lobbyIdRef = useRef(lobbyId);
  lobbyIdRef.current = lobbyId;

  useEffect(function () {
    // Prüfe ob ein Lobby-Link in der URL steht (?lobby=ABC12)
    const urlParams = new URLSearchParams(window.location.search);
    const linkLobbyId = urlParams.get('lobby');
    if (linkLobbyId) {
      setLobbyId(linkLobbyId);
    }

    // ── Event: Raum wurde erfolgreich erstellt ──
    function handleRoomCreated(data) {
      // playerNameRef.current ist IMMER aktuell (nicht eingefroren!)
      onJoin({
        lobbyId: data.roomId,
        playerName: playerNameRef.current,
        initialPlayers: [playerNameRef.current],
        isHost: true,
      });
    }

    // ── Event: Lobby-Update (nach erfolgreichem Beitreten) ──
    function handleLobbyUpdate(roomData) {
      const playerNames = roomData.players.map(function (player) {
        return player.name || player.playerName || player;
      });
      onJoin({
        lobbyId: roomData.roomId || lobbyIdRef.current,
        playerName: playerNameRef.current,
        initialPlayers: playerNames,
        isHost: false,
      });
    }

    // ── Event: Fehler vom Server ──
    function handleError(data) {
      setError(data.message);
      setTimeout(() => setError(''), 3000);
    }

    socket.on('room_created', handleRoomCreated);
    socket.on('lobby_update', handleLobbyUpdate);
    socket.on('error_msg', handleError);

    return function cleanup() {
      socket.off('room_created', handleRoomCreated);
      socket.off('lobby_update', handleLobbyUpdate);
      socket.off('error_msg', handleError);
    };
  }, [onJoin]);
  // ↑ Dependency Array: nur onJoin. NICHT playerName!
  // Weil wir useRef nutzen, muss der Effect nicht bei jeder Eingabe
  // neu registriert werden. Das spart Performance.

  function handleCreate() {
    if (playerName.trim() !== '') {
      socket.emit('create_room', { playerName: playerName.trim() });
    }
  }

  function handleJoin() {
    if (playerName.trim() !== '' && lobbyId.trim() !== '') {
      socket.emit('join_room', {
        roomId: lobbyId.trim().toUpperCase(),
        playerName: playerName.trim(),
      });
    }
  }

  // Styling (passend zum Mockup: dunkles Casino-Grün + Gold)
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#F5F5DC',
    border: '1px solid #D4AF3788',
    borderRadius: '6px',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    color: '#0A3628',
    outline: 'none',
    boxSizing: 'border-box',
  };

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
      {/* Tischrand-Oval (dekorativ) */}
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

      {/* Hauptbox */}
      <div
        style={{
          background: 'rgba(10, 54, 40, 0.92)',
          border: '2px solid #D4AF37',
          borderRadius: '16px',
          padding: '40px 44px',
          width: '360px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Titel */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h1
            style={{
              margin: 0,
              color: '#D4AF37',
              fontSize: '36px',
              letterSpacing: '2px',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            BlackJack 21
          </h1>
          <div
            style={{
              color: '#F5F5DC66',
              fontSize: '13px',
              letterSpacing: '6px',
              marginTop: '6px',
            }}
          >
            ♠ ♥ ♣ ♦
          </div>
        </div>

        {/* Fehlermeldung */}
        {error && (
          <div
            style={{
              background: '#8B000033',
              border: '1px solid #8B0000',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#ff6b6b',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* Name-Eingabe */}
        <input
          style={inputStyle}
          placeholder="Name"
          value={playerName}
          onChange={function (e) {
            setPlayerName(e.target.value);
          }}
          onKeyDown={function (e) {
            if (e.key === 'Enter' && playerName.trim()) handleCreate();
          }}
        />

        {/* LobbyID + Beitreten */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="LobbyID"
            value={lobbyId}
            onChange={function (e) {
              setLobbyId(e.target.value.toUpperCase());
            }}
            onKeyDown={function (e) {
              if (e.key === 'Enter') handleJoin();
            }}
          />
          <button
            onClick={handleJoin}
            style={{
              padding: '10px 16px',
              background: '#D4AF37',
              color: '#0A3628',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              fontFamily: 'Georgia, serif',
              cursor:
                playerName.trim() && lobbyId.trim()
                  ? 'pointer'
                  : 'not-allowed',
              opacity: playerName.trim() && lobbyId.trim() ? 1 : 0.5,
              whiteSpace: 'nowrap',
            }}
          >
            Beitreten
          </button>
        </div>

        {/* Trennlinie */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#F5F5DC55',
            fontSize: '12px',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: '#D4AF3744' }} />
          oder
          <div style={{ flex: 1, height: '1px', background: '#D4AF3744' }} />
        </div>

        {/* Lobby Erstellen */}
        <button
          onClick={handleCreate}
          style={{
            width: '100%',
            padding: '12px 0',
            background: playerName.trim() ? '#D4AF37' : '#D4AF3744',
            color: playerName.trim() ? '#0A3628' : '#D4AF3788',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: 'Georgia, serif',
            cursor: playerName.trim() ? 'pointer' : 'not-allowed',
            letterSpacing: '1px',
          }}
        >
          Lobby Erstellen
        </button>
      </div>
    </div>
  );
}
