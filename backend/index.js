// ────────────────────────────────────────────────────────────────────────────
// index.js — Der Hauptserver
//
// Hier passiert Folgendes:
// 1. Express-Server erstellen (für HTTP-Anfragen)
// 2. Socket.IO darauf aufsetzen (für Echtzeit-WebSocket-Kommunikation)
// 3. CORS konfigurieren (damit Frontend von anderem Port zugreifen darf)
// 4. Routes und Socket-Handler einbinden
// 5. Im Produktionsmodus das gebaute Frontend ausliefern
// ────────────────────────────────────────────────────────────────────────────

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────
// Cross-Origin Resource Sharing: Erlaubt dem Frontend (Port 5173 in der
// Entwicklung) Anfragen an den Backend-Server (Port 3001) zu senden.
// Ohne CORS würde der Browser die Anfragen blockieren.
app.use(cors({
  origin: [
    'http://localhost:5173',    // Vite Dev-Server
    'http://localhost:3001',    // Falls Frontend vom selben Port kommt
    'https://blackjacck21-dubwbnf2eyhjd4b0.swedencentral-01.azurewebsites.net'
  ]
}));

app.use(express.json());

// ── HTTP + Socket.IO Server ───────────────────────────────────────────────
// Socket.IO braucht einen HTTP-Server als Basis. Express allein reicht nicht,
// weil WebSockets ein Upgrade des HTTP-Protokolls benötigen.
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3001',
      'https://blackjacck21-dubwbnf2eyhjd4b0.swedencentral-01.azurewebsites.net'
    ],
    methods: ['GET', 'POST']
  }
});

// ── REST Routes ───────────────────────────────────────────────────────────
app.use('/game', require('./routes/game'));

// ── React Build ausliefern (Produktion) ───────────────────────────────────
// In Produktion wird das gebaute Frontend (npm run build → dist/) vom
// Express-Server direkt ausgeliefert. Das '*' fängt alle Routen ab und
// liefert index.html → React Router übernimmt dann.
app.use(express.static(path.join(__dirname, '../BJ-Frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../BJ-Frontend/dist', 'index.html'));
});

// ── Socket.IO Verbindungen ────────────────────────────────────────────────
// Jedes Mal wenn ein Browser sich verbindet, wird 'connection' gefeuert.
// Wir übergeben io (der Server) und socket (die einzelne Verbindung)
// an den lobbyHandler, der alle Events registriert.
const lobbyHandler = require('./Socket/lobbyHandler');
io.on('connection', (socket) => {
  console.log('Spieler verbunden:', socket.id);
  lobbyHandler(io, socket);
});

// ── Server starten ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
