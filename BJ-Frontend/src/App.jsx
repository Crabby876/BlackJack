import { useState } from 'react';
import StartScreen from './components/StartScreen';
import Lobby from './components/Lobby';
import Game from './components/Game';

// ────────────────────────────────────────────────────────────────────────────
// App.jsx — Hauptkomponente mit 3 Ansichten
//
// Der Flow ist: StartScreen → Lobby → Game
//
// lobbyData wird von Komponente zu Komponente weitergegeben und enthält:
// - lobbyId:        Die Raum-ID (z.B. "ABC12")
// - playerName:     Der eigene Name
// - isHost:         Bin ich der Host?
// - initialPlayers: Liste der Spielernamen (nur für Lobby)
// - initialGameState: Der erste Spielzustand (wird von Lobby an Game übergeben)
// ────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState('start');
  const [lobbyData, setLobbyData] = useState(null);

  // Wird von StartScreen aufgerufen, wenn Lobby erstellt oder beigetreten
  function handleJoin(data) {
    setLobbyData(data);
    setView('lobby');
  }

  // Wird von Lobby aufgerufen, wenn Host das Spiel startet
  function handleGameStart(updatedLobbyData) {
    setLobbyData(updatedLobbyData);
    setView('game');
  }

  // Zurück zur Lobby (z.B. nach dem Spiel)
  function handleBackToLobby() {
    setLobbyData(prev => ({ ...prev, initialGameState: null }));
    setView('lobby');
  }

  if (view === 'start') {
    return <StartScreen onJoin={handleJoin} />;
  }

  if (view === 'lobby') {
    return <Lobby lobbyData={lobbyData} onGameStart={handleGameStart} />;
  }

  if (view === 'game') {
    return <Game lobbyData={lobbyData} onBackToLobby={handleBackToLobby} />;
  }
}
