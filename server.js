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
    console.log(`\n=== JOIN ROOM EVENT ===`);
    console.log(`Socket ID: ${socket.id}`);
    console.log(`Room: ${roomId}`);
    console.log(`Username: ${userName}`);
    console.log(`Current room: ${socket.currentRoomId}`);
    
    // Prevent duplicate joins from same socket
    if (socket.currentRoomId === roomId) {
      console.log(`❌ Socket ${socket.id} already in room ${roomId}, ignoring duplicate join`);
      return;
    }

    // Leave previous room if exists
    if (socket.currentRoomId) {
      console.log(`🚪 Leaving previous room: ${socket.currentRoomId}`);
      const prevRoom = rooms.get(socket.currentRoomId);
      if (prevRoom && prevRoom.has(socket.id)) {
        prevRoom.delete(socket.id);
        socket.to(socket.currentRoomId).emit('user-left', {
          id: socket.id,
          userName: socket.userName
        });
      }
    }

    socket.join(roomId);
    socket.userName = userName;
    socket.roomId = roomId;
    socket.currentRoomId = roomId; // Track current room

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      console.log(`🏠 Creating new room: ${roomId}`);
      rooms.set(roomId, new Map());
    }

    const room = rooms.get(roomId);
    
    // Log current room state before adding user
    console.log(`📊 Room ${roomId} before adding user:`, Array.from(room.keys()));
    
    // Remove any existing user with same socket ID (reconnection case)
    if (room.has(socket.id)) {
      console.log(`♻️ Removing existing user with same socket ID`);
      room.delete(socket.id);
    }

    // Add user to room
    room.set(socket.id, {
      id: socket.id,
      userName: userName
    });

    // Get current users in room as array
    const roomUsers = Array.from(room.values());
    console.log(`📊 Room ${roomId} after adding user:`, roomUsers.map(u => u.userName));

    // Send user list to new user
    socket.emit('user-list', roomUsers);
    console.log(`📤 Sent user list to ${userName}:`, roomUsers.length, 'users');

    // Notify others about new user
    socket.to(roomId).emit('user-joined', {
      id: socket.id,
      userName: userName
    });
    console.log(`📢 Notified others about ${userName} joining`);

    console.log(`✅ ${userName} joined room ${roomId}. Total users: ${roomUsers.length}`);
    console.log(`=== END JOIN ROOM EVENT ===\n`);
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
      const room = rooms.get(socket.roomId);
      
      // Remove user from room
      if (room.has(socket.id)) {
        const user = room.get(socket.id);
        room.delete(socket.id);
        
        // Notify others about user leaving
        socket.to(socket.roomId).emit('user-left', {
          id: socket.id,
          userName: user.userName
        });
        
        console.log(`${user.userName} left room ${socket.roomId}. Remaining users: ${room.size}`);
      }

      // Clean up empty rooms
      if (room.size === 0) {
        rooms.delete(socket.roomId);
        console.log(`Room ${socket.roomId} deleted (empty)`);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});