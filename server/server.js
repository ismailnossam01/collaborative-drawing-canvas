const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const DrawingState = require('./drawing-state');
const RoomManager = require('./rooms');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../client')));

const roomManager = new RoomManager();
const drawingState = new DrawingState();
roomManager.setDrawingState('default', drawingState);

const users = new Map();

const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
];

let colorIndex = 0;

io.on('connection', (socket) => {
    const userId = socket.id;
    const userColor = colors[colorIndex % colors.length];
    colorIndex++;
    
    const userName = `User ${users.size + 1}`;
    const defaultRoom = 'default';
    
    roomManager.joinRoom(userId, defaultRoom);
    
    users.set(userId, {
        id: userId,
        name: userName,
        color: userColor,
        socket: socket,
        room: defaultRoom
    });

    socket.emit('init', {
        userId: userId,
        history: drawingState.getHistory(),
        users: Array.from(users.values()).map(u => ({
            id: u.id,
            name: u.name,
            color: u.color
        }))
    });

    socket.broadcast.emit('user_joined', {
        users: Array.from(users.values()).map(u => ({
            id: u.id,
            name: u.name,
            color: u.color
        }))
    });

    socket.on('drawing', (data) => {
        drawingState.addDrawingPoint(userId, data);
        socket.broadcast.emit('drawing', {
            ...data,
            userId: userId
        });
    });

    socket.on('draw_end', () => {
        drawingState.endStroke(userId);
        socket.broadcast.emit('draw_end', { userId: userId });
    });

    socket.on('cursor_move', (data) => {
        const user = users.get(userId);
        socket.broadcast.emit('cursor_move', {
            userId: userId,
            x: data.x,
            y: data.y,
            color: user.color,
            name: user.name
        });
    });

    socket.on('undo', () => {
        const newHistory = drawingState.undo();
        io.emit('undo', { history: newHistory });
    });

    socket.on('redo', () => {
        const newHistory = drawingState.redo();
        io.emit('redo', { history: newHistory });
    });

    socket.on('clear_canvas', () => {
        drawingState.clear();
        io.emit('clear_canvas');
    });

    socket.on('disconnect', () => {
        const user = users.get(userId);
        if (user) {
            roomManager.leaveRoom(userId, user.room);
        }
        users.delete(userId);
        socket.broadcast.emit('user_left', {
            userId: userId,
            users: Array.from(users.values()).map(u => ({
                id: u.id,
                name: u.name,
                color: u.color
            }))
        });
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in multiple browser windows to test`);
});