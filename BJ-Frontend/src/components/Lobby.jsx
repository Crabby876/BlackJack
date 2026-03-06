import { useEffect, useState } from 'react';
import { socket } from '../socket';

export default function Lobby(props) {
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState([]);

    const [players, setPlayers] = useState([props.lobbyData.playerName]);

    useEffect(function() {
        function handleReceiveMessage(newMessage) {
            setMessages(function(previousMessage) {
                const updateMessage = [...previousMessage, newMessage];
                return updateMessage;
            });
        }

        function handleUpdatePlayers(playerList) {
            setPlayers(playerList);
        }

        socket.on('receive_message', handleReceiveMessage);
        socket.on('update_players', handleUpdatePlayers);

        function cleanupSocket() {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('update_players', handleUpdatePlayers);
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

    return (
        <div>
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