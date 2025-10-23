import { io } from 'socket.io-client'

const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080'
export const socket = io(URL, {
  transports: ['websocket'],
  autoConnect: true
})

export default socket
