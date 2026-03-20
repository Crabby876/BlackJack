import { useEffect, useState } from 'react';
import { socket } from '../socket';

export default function Lobby(props) {
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');

    const [players, setPlayers] = useState(props.lobbyData.initialPlayers);

    useEffect(function() {
        function handleReceiveMessage(newMessage) {
            setMessages(function(previousMessage) {
                const updateMessage = [...previousMessage, newMessage];
                return updateMessage;
            });
        }

        function handleLobbyUpdate(roomData) {
            const playerNames = roomData.players.map(function(player) {
                // Hier ebenfalls die sichere Abfrage einbauen
                return player.playerName || player.name || player; 
            });
            setPlayers(playerNames);
        }

        // Ereignisse anmelden
        socket.on('receive_message', handleReceiveMessage);
        socket.on('lobby_update', handleLobbyUpdate);

        function cleanupSocket() {
            // Ereignisse exakt mit demselben Namen wieder abmelden
            socket.off('receive_message', handleReceiveMessage);
            socket.off('lobby_update', handleLobbyUpdate);
        }

        return cleanupSocket;
    }, []);

    function handleInputChange(event) {
        setCurrentMessage(event.target.value);
    }

    function sendMessage() {
        if (currentMessage.trim() !== '') {
            const messageData = {
                lobbyId: props.lobbyData.lobbyId,
                text: props.lobbyData.playerName + ': ' + currentMessage
            };

            socket.emit('send_message', messageData);

            setCurrentMessage('');
        }
    }

    function copyLink() {
        const shareLink = window.location.origin + '?lobby=' + props.lobbyData.lobbyId;
        navigator.clipboard.writeText(shareLink);
        alert('Link wurde Kopiert: ' + shareLink);
    }


    return (
        <div>
            <button onClick={copyLink} style={{ marginBottom: '20px' }}>
            Einladungs-Link kopieren
            </button>
            <h2>Lobby: {props.lobbyData.lobbyId}</h2>

            <div style ={{ border: '1px solid black', padding: '10px', marginBottom: '20px', width: '300px' }}>
                <h3>Anwesende Spieler:</h3>
                <ul>
                    {players.map(function(playerItem, index) {
                        return (
                            <li key= {index}>{playerItem}</li>
                        );
                    })}
                </ul>
            </div>

            <div className='chat'>
                {messages.map(function(messageItem, index) {
                    return (
                        <p key={index}>{messageItem.text}</p>
                    );
                })}
            </div>

            <input
                value = {currentMessage}
                onChange={handleInputChange}
            />
            <button onClick={sendMessage}>Senden</button>
        </div>
    )
}