import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getAllowedOrigins } from '../utils/origins.js';

let io;

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const userRoom = (userId) => `user:${userId}`;

const readAccessToken = (cookieHeader = '') => {
  const entry = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('access_token='));
  return entry ? decodeURIComponent(entry.slice('access_token='.length)) : null;
};

const emitReaderCount = (postId) => {
  const room = io.sockets.adapter.rooms.get(postId);
  io.to(postId).emit('activeReadersUpdate', room ? room.size : 0);
};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  // Guests may connect (live reader counts); only a valid JWT cookie identifies a user.
  io.use((socket, next) => {
    const token = readAccessToken(socket.handshake.headers.cookie);
    if (token) {
      try {
        socket.data.userId = jwt.verify(token, process.env.JWT_SECRET).id;
      } catch {
        socket.data.userId = null;
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.data.userId) {
      socket.join(userRoom(socket.data.userId));
    }

    // Room names must be post IDs; otherwise a client could join another socket's private room.
    socket.on('joinPost', (postId) => {
      if (typeof postId !== 'string' || !OBJECT_ID.test(postId)) return;
      socket.join(postId);
      emitReaderCount(postId);
    });

    socket.on('leavePost', (postId) => {
      if (typeof postId !== 'string' || !OBJECT_ID.test(postId)) return;
      socket.leave(postId);
      emitReaderCount(postId);
    });

    socket.on('typing', ({ postId, username } = {}) => {
      if (typeof postId !== 'string' || !OBJECT_ID.test(postId) || !socket.rooms.has(postId)) return;
      socket.to(postId).emit('userTyping', String(username || 'Someone').slice(0, 40));
    });

    socket.on('stopTyping', ({ postId } = {}) => {
      if (typeof postId !== 'string' || !OBJECT_ID.test(postId) || !socket.rooms.has(postId)) return;
      socket.to(postId).emit('userStoppedTyping');
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

export const notifyUser = (userId, event, data) => {
  if (io && userId) {
    io.to(userRoom(String(userId))).emit(event, data);
  }
};
