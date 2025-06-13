const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static('public'));

// Store active rooms
const rooms = new Map();

// Generate a random room code
function generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create a new room
    socket.on('createRoom', () => {
        const roomCode = generateRoomCode();
        rooms.set(roomCode, {
            players: [socket.id],
            answers: new Map(),
            currentQuestion: 0
        });
        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);
    });

    // Join an existing room
    socket.on('joinRoom', (roomCode) => {
        const room = rooms.get(roomCode);
        if (room && room.players.length < 2) {
            room.players.push(socket.id);
            socket.join(roomCode);
            socket.emit('roomJoined', roomCode);
            
            // Start the game when both players have joined
            if (room.players.length === 2) {
                io.to(roomCode).emit('gameStart');
            }
        } else {
            socket.emit('error', 'Room not found or full');
        }
    });

    // Handle answer submission
    socket.on('submitAnswer', ({ roomCode, answer }) => {
        const room = rooms.get(roomCode);
        if (room) {
            room.answers.set(socket.id, answer);
            
            // If both players have answered, send the answers to both players
            if (room.answers.size === 2) {
                const [player1, player2] = room.players;
                const answer1 = room.answers.get(player1);
                const answer2 = room.answers.get(player2);
                
                io.to(player1).emit('answerReceived', answer2);
                io.to(player2).emit('answerReceived', answer1);
            }
        }
    });

    // Handle next question
    socket.on('nextQuestion', (roomCode) => {
        const room = rooms.get(roomCode);
        if (room) {
            room.currentQuestion++;
            room.answers.clear();
            io.to(roomCode).emit('nextQuestion');
        }
    });

    // Handle game restart
    socket.on('restartGame', (roomCode) => {
        const room = rooms.get(roomCode);
        if (room) {
            room.currentQuestion = 0;
            room.answers.clear();
            io.to(roomCode).emit('gameRestart');
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Clean up rooms when players disconnect
        for (const [roomCode, room] of rooms.entries()) {
            const playerIndex = room.players.indexOf(socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                if (room.players.length === 0) {
                    rooms.delete(roomCode);
                } else {
                    io.to(roomCode).emit('playerDisconnected');
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 