import { useState, useEffect } from 'react';
import { socket } from '../socket';

export default function StartScreen(props) {
    const [playerName, setPlayerName] = useState('');
    const [lobbyId, setLobbyId] = useState('');

    useEffect(function() {
        // Link auslesen
        const urlParams = new URLSearchParams(window.location.search);
        const linkLobbyId = urlParams.get('lobby');
        if (linkLobbyId !== null) {
            setLobbyId(linkLobbyId);
        }

        function handleRoomCreated(data) {
            props.onJoin({ lobbyId: data.roomId, playerName: playerName, initialPlayers: [playerName] });
        }

        function handleLobbyUpdate(roomData) {
            console.log("Daten vom Backend:", roomData); // Zeigt dir in der F12-Konsole die Struktur
            
            const playerNames = roomData.players.map(function(player) {
                // Fängt alle gängigen Benennungen deines Backends ab
                return player.playerName || player.name || player; 
            });

            props.onJoin({ lobbyId: roomData.id || lobbyId, playerName: playerName, initialPlayers: playerNames });
        }

        socket.on('room_created', handleRoomCreated);
        socket.on('lobby_update', handleLobbyUpdate);

        return function cleanup() {
            socket.off('room_created', handleRoomCreated);
            socket.off('lobby_update', handleLobbyUpdate);
        };
    }, [playerName, lobbyId, props]);

    function handleCreate() {
        if (playerName !== '') {
            socket.emit('create_room', { playerName: playerName });
        }
    }

    function handleJoin() {
        if (playerName !== '' && lobbyId !== '') {
            socket.emit('join_room', { roomId: lobbyId, playerName: playerName });
        }
    }

    return (
        <div>
            <h1>Blackjack</h1>
            <input
                placeholder="Dein Name"
                value={playerName}
                onChange={function(e) { setPlayerName(e.target.value); }}
            />
            <input
                placeholder="Lobby ID (für Beitritt)"
                value={lobbyId}
                onChange={function(e) { setLobbyId(e.target.value); }}
            />
            <br /><br />
            <button onClick={handleCreate} style={{ marginRight: '10px' }}>Neu Erstellen</button>
            <button onClick={handleJoin}>Beitreten</button>
        </div>
    );
}