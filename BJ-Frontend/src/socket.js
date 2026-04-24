// ────────────────────────────────────────────────────────────────────────────
// socket.js — Die Verbindung zum Backend
//
// import.meta.env.MODE ist eine Vite-Variable:
// - 'development' → bei `npm run dev` → verbindet zu localhost:3001
// - 'production'  → bei `npm run build` → verbindet zur Azure-URL
//
// Wir exportieren EIN EINZIGES socket-Objekt. Alle Komponenten importieren
// dasselbe Objekt, dadurch teilen sie sich eine Verbindung.
// ────────────────────────────────────────────────────────────────────────────

import { io } from 'socket.io-client';

const URL = import.meta.env.MODE === 'production'
  ? 'https://blackjacck21-dubwbnf2eyhjd4b0.swedencentral-01.azurewebsites.net'
  : 'http://localhost:3001';

export const socket = io(URL);
