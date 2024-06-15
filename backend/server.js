const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http')
const { Server } = require('socket.io')

const app = express();
app.use(cors());

const server = http.createServer()
const io = new Server(server, {
    cors:{
        origin: '*',
        methods: ['GET', 'POST'],
    }
})

const emailToSocket = new Map()
const socketToEamil = new Map()

io.on('connection', (socket) => {
    console.log('user connected', socket.id);

    socket.on('join', (data) => {
        const { email, roomName } = data
        emailToSocket.set(email, socket.id)
        socketToEamil.set(socket.id, email)
        socket.join(roomName)
        io.to(socket.id).emit('join', { email, roomName })
        const message = `New User Joined. Say "Hi" `
        socket.broadcast.to(roomName).emit('UserJoined', { message, socketId: socket.id})
    })
    
    socket.on('user:call', ({ to, offer }) => {
        io.to(to).emit('incoming:call', { from: socket.id, offer });
    });

    socket.on('call:accepted', ({ to, answer }) =>{
        io.to(to).emit('call:accepted', { from: socket.id, answer })
    })

    socket.on('nego:needed', ({ to, offer }) => {
        io.to(to).emit('nego:needed', { from: socket.id, offer });
    })
    
    socket.on('nego:done', ({ to, answer }) => {
        io.to(to).emit('nego:final', { from: socket.id, answer });
    })

    socket.on('disconnect', () => {
        console.log('user disconnected')
    })
})

const port = process.env.PORT || 5000;

server.listen(port, () =>{
    console.log(`Server is running on port ${port}`)
})