import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

// Configure Socket.IO with Railway-specific settings
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,
  transports: ['polling'], // Use only polling for Railway compatibility
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6
});

// Configure CORS for Express
app.use(cors({
  origin: "*",
  credentials: true
}));

// Railway needs this middleware to handle WebSocket upgrades properly
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    transport: 'socket.io ready',
    uptime: process.uptime()
  });
});

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Virtual Space Server is running!', 
    timestamp: new Date().toISOString(),
    socketio: 'ready',
    transports: ['polling', 'websocket']
  });
});

// Store room information
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', ({ roomId, userName }) => {
    socket.join(roomId);
    socket.userName = userName;
    socket.roomId = roomId;

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    // Add user to room
    rooms.get(roomId).add({
      id: socket.id,
      userName: userName
    });

    // Get current users in room
    const roomUsers = Array.from(rooms.get(roomId));

    // Send user list to new user
    socket.emit('user-list', roomUsers);

    // Notify others about new user
    socket.to(roomId).emit('user-joined', {
      id: socket.id,
      userName: userName
    });

    console.log(`${userName} joined room ${roomId}`);
  });

  // WebRTC signaling
  socket.on('webrtc-signal', ({ userId, roomId, signal }) => {
    socket.to(userId).emit('webrtc-signal', {
      userId: socket.id,
      signal: signal
    });
  });

  // Mute/unmute status
  socket.on('mute-status', ({ roomId, isMuted }) => {
    socket.to(roomId).emit('user-mute-status', {
      userId: socket.id,
      userName: socket.userName,
      isMuted: isMuted
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    if (socket.roomId && rooms.has(socket.roomId)) {
      const roomUsers = rooms.get(socket.roomId);
      roomUsers.forEach(user => {
        if (user.id === socket.id) {
          roomUsers.delete(user);
        }
      });

      // Notify others about user leaving
      socket.to(socket.roomId).emit('user-left', {
        id: socket.id,
        userName: socket.userName
      });

      // Clean up empty rooms
      if (roomUsers.size === 0) {
        rooms.delete(socket.roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});