import { useState, useEffect } from 'react';
import { socket } from '../socket';

export default function StartScreen(props) {
    const [playerName, setPlayerName] = useState('');
    const [lobbyId, setLobbyId] = useState('');

    useEffect(function() {
        function handleRoomCreated(data) {
            props.onJoin({ lobbyId: data.roomId, playerName: playerName });
        }

        socket.on('room_created', handleRoomCreated);

        return function cleanup() {
            socket.off('room_created', handleRoomCreated);
        };
    }, [playerName, props]);

    function handlePlayerNameChange(event) {
        setPlayerName(event.target.value);
    }

    function handleLobbyIdChange(event) {
        setLobbyId(event.target.value);
    }

    function handleJoin() {
        // Der Name darf niemals leer sein
        if (playerName !== '') {
            
            if (lobbyId === '') {
                // Wenn keine ID da ist -> Raum erstellen
                socket.emit('create_room', { playerName: playerName });
            } else {
                // Wenn eine ID da ist -> Raum beitreten
                socket.emit('join_room', { roomId: lobbyId, playerName: playerName });
                // Direkt in die Lobby wechseln beim Beitreten
                props.onJoin({ lobbyId: lobbyId, playerName: playerName });
            }
        }
    }

    useEffect(function() {
        const urlParams = new URLSearchParams(window.location.search);
        const linkLobbyId = urlParams.get('lobby')  ;

        if (linkLobbyId !== null) {
            setLobbyId(linkLobbyId);
        }
    }, []);

    return (
        <div>
            <h1>Blackjack</h1>
            <input
                placehoder="Dein Name"
                onChange={handlePlayerNameChange}
            />  
            <input
            placeholder="Lobby ID"
            value={lobbyId} 
            onChange={handleLobbyIdChange}
            />
            <button onClick={handleJoin}>Beitreten / Erstellen</button>
        </div>
    )
}