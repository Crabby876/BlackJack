import { useState } from 'react';
import StartScreen from './components/StartScreen';
import Lobby from './components/Lobby';

export default function App() {
    const [lobbyData, setLobbyData] = useState(null);

    if (lobbyData === null) {
        return (
            <div>
                <StartScreen onJoin={setLobbyData} />
            </div>
        );
    } else {
        return (
            <div>
                <Lobby lobbyData={lobbyData} />
            </div>
        );
    }
}