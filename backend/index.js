const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://blackjacck21-dubwbnf2eyhjd4b0.swedencentral-01.azurewebsites.net'
  ]
}));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://blackjacck21-dubwbnf2eyhjd4b0.swedencentral-01.azurewebsites.net'
    ],
    methods: ["GET", "POST"]
  }
});

// Routes
app.use('/game', require('./routes/game'));

// React Build servieren (nach den API-Routen!)
app.use(express.static(path.join(__dirname, '../BJ-Frontend/dist')));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../BJ-Frontend/dist', 'index.html'));
});

// Socket
const lobbyHandler = require('./Socket/lobbyHandler');
io.on('connection', (socket) => {
  console.log('Spieler verbunden:', socket.id);
  lobbyHandler(io, socket);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});