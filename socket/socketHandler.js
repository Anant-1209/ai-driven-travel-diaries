import { Server } from 'socket.io';

let io;
const userSocketMap = {}; // { userId: socketId }

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // For dev mode, accept all. In prod, configure specific origins
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected via Socket:', socket.id);

    // Track user (Support multiple tabs)
    socket.on('registerUser', (userId) => {
      if (!userSocketMap[userId]) {
        userSocketMap[userId] = new Set();
      }
      userSocketMap[userId].add(socket.id);
      console.log(`User ${userId} registered socket ${socket.id}. Total sockets: ${userSocketMap[userId].size}`);
    });

    // Join Post Room for active readers & typing
    socket.on('joinPost', (postId) => {
      socket.join(postId);
      const room = io.sockets.adapter.rooms.get(postId);
      const activeCount = room ? room.size : 0;
      io.to(postId).emit('activeReadersUpdate', activeCount);
    });

    socket.on('leavePost', (postId) => {
      socket.leave(postId);
      const room = io.sockets.adapter.rooms.get(postId);
      const activeCount = room ? room.size : 0;
      io.to(postId).emit('activeReadersUpdate', activeCount);
    });

    socket.on('typing', ({ postId, username }) => {
      socket.to(postId).emit('userTyping', username);
    });

    socket.on('stopTyping', ({ postId }) => {
      socket.to(postId).emit('userStoppedTyping');
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      // Remove from tracking map
      for (const userId in userSocketMap) {
        if (userSocketMap[userId].has(socket.id)) {
          userSocketMap[userId].delete(socket.id);
          if (userSocketMap[userId].size === 0) {
            delete userSocketMap[userId];
          }
          break;
        }
      }
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

export const notifyUser = (userId, event, data) => {
  const socketIds = userSocketMap[userId];
  if (socketIds && io) {
    socketIds.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
  }
};
