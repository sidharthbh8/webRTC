const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app); 
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
});

const emailToSocket = new Map();
const socketToEmail = new Map();
const roomToParticipants = new Map();

io.on('connection', (socket) => {
    console.log('User connected', socket.id);

    socket.on('join', ({ email, roomName }) => {
        socket.join(roomName);
        emailToSocket.set(email, socket.id);
        socketToEmail.set(socket.id, email);

        const participant = { email, socketId: socket.id };
        if (!roomToParticipants.has(roomName)) {
            roomToParticipants.set(roomName, [participant]);
        } else {
            roomToParticipants.get(roomName).push(participant);
        }

        io.to(socket.id).emit('join', { email, roomName });
        const message = `New User Joined. Say "Hi"`;
        socket.broadcast.to(roomName).emit('UserJoined', { message, socketId: socket.id });
    });

    socket.on('user:call', ({ to, offer }) => {
        io.to(to).emit('incoming:call', { from: socket.id, offer });
    });

    socket.on('call:accepted', ({ to, answer }) => {
        io.to(to).emit('call:accepted', { from: socket.id, answer });
    });

    socket.on('nego:needed', ({ to, offer }) => {
        io.to(to).emit('nego:needed', { from: socket.id, offer });
    });

    socket.on('nego:done', ({ to, answer }) => {
        io.to(to).emit('nego:final', { from: socket.id, answer });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);

        const email = socketToEmail.get(socket.id);
        emailToSocket.delete(email);
        socketToEmail.delete(socket.id);

        roomToParticipants.forEach((participants, roomName) => {
            const index = participants.findIndex(p => p.socketId === socket.id);
            if (index !== -1) {
                participants.splice(index, 1);
                if (participants.length === 0) {
                    roomToParticipants.delete(roomName);
                }
            }
        });
    });
});

const port = process.env.PORT || 5000;

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
