import { io } from 'socket.io-client';

const URL = import.meta.env.MODE === 'production'
  ? 'https://blackjacck21-dubwbnf2eyhjd4b0.swedencentral-01.azurewebsites.net'
  : 'http://localhost:3001';

export const socket = io(URL);