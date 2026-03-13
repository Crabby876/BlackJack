const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Routes
app.use('/game', require('./routes/game'));

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