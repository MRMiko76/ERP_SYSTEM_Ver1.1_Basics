import { Server } from 'socket.io';

interface UserSession {
  id: string;
  name?: string;
  email?: string;
  joinedAt: string;
}

interface PostNotification {
  id: string;
  title: string;
  action: 'created' | 'updated' | 'deleted';
  authorName: string;
  timestamp: string;
}

export const setupSocket = (io: Server) => {
  // Store connected users
  const connectedUsers = new Map<string, UserSession>();
  
  // Store room memberships
  const roomMembers = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle user joining
    socket.on('user:join', (userData: { name?: string; email?: string }) => {
      const userSession: UserSession = {
        id: socket.id,
        name: userData.name,
        email: userData.email,
        joinedAt: new Date().toISOString(),
      };
      
      connectedUsers.set(socket.id, userSession);
      
      // Join default room
      socket.join('main');
      if (!roomMembers.has('main')) {
        roomMembers.set('main', new Set());
      }
      roomMembers.get('main')!.add(socket.id);
      
      // Notify others
      socket.to('main').emit('user:joined', {
        user: userSession,
        totalUsers: connectedUsers.size,
      });
      
      // Send current user list to the joined user
      socket.emit('user:list', {
        users: Array.from(connectedUsers.values()),
        totalUsers: connectedUsers.size,
      });
      
      console.log(`User ${userData.name || userData.email || socket.id} joined`);
    });

    // Handle chat messages
    socket.on('message', (msg: { 
      text: string; 
      senderId: string;
      room?: string;
      type?: 'chat' | 'notification' | 'system';
    }) => {
      const room = msg.room || 'main';
      const messageData = {
        id: Date.now().toString(),
        text: msg.text,
        senderId: msg.senderId,
        senderName: connectedUsers.get(msg.senderId)?.name || 'Anonymous',
        timestamp: new Date().toISOString(),
        type: msg.type || 'chat',
      };

      // Broadcast to room or send back to sender
      if (room === 'private') {
        // Echo back for private messages
        socket.emit('message', {
          ...messageData,
          text: `Echo: ${msg.text}`,
          senderId: 'system',
          senderName: 'System',
        });
      } else {
        // Broadcast to all in room
        io.to(room).emit('message', messageData);
      }
    });

    // Handle post notifications
    socket.on('post:notification', (notification: PostNotification) => {
      // Broadcast to all connected clients in main room
      io.to('main').emit('post:notification', {
        ...notification,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle typing indicators
    socket.on('typing:start', (data: { roomId: string; userName: string }) => {
      socket.to(data.roomId).emit('typing:start', {
        userId: socket.id,
        userName: data.userName,
      });
    });

    socket.on('typing:stop', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('typing:stop', {
        userId: socket.id,
      });
    });

    // Handle room joining/leaving
    socket.on('room:join', (roomId: string) => {
      socket.join(roomId);
      
      if (!roomMembers.has(roomId)) {
        roomMembers.set(roomId, new Set());
      }
      roomMembers.get(roomId)!.add(socket.id);
      
      socket.emit('room:joined', {
        roomId,
        memberCount: roomMembers.get(roomId)!.size,
      });
      
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('room:leave', (roomId: string) => {
      socket.leave(roomId);
      roomMembers.get(roomId)?.delete(socket.id);
      
      socket.emit('room:left', {
        roomId,
        memberCount: roomMembers.get(roomId)?.size || 0,
      });
      
      console.log(`User ${socket.id} left room ${roomId}`);
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        connectedUsers.delete(socket.id);
        
        // Remove from all rooms
        roomMembers.forEach((members, roomId) => {
          members.delete(socket.id);
        });
        
        // Notify others
        socket.to('main').emit('user:left', {
          user,
          totalUsers: connectedUsers.size,
        });
        
        console.log(`User ${user.name || user.email || socket.id} disconnected`);
      }
    });

    // Send welcome message
    socket.emit('message', {
      id: 'welcome-' + Date.now(),
      text: 'Welcome to Real-time Server! You can chat, receive notifications, and more.',
      senderId: 'system',
      senderName: 'System',
      timestamp: new Date().toISOString(),
      type: 'system',
    });

    // Send connection info
    socket.emit('connection:info', {
      socketId: socket.id,
      serverTime: new Date().toISOString(),
      features: [
        'Real-time chat',
        'Post notifications',
        'User presence',
        'Room support',
        'Typing indicators',
      ],
    });
  });

  // Set up periodic health check
  setInterval(() => {
    io.emit('server:heartbeat', {
      timestamp: new Date().toISOString(),
      connectedUsers: connectedUsers.size,
    });
  }, 30000); // Every 30 seconds
};