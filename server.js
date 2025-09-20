const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handler(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || `http://localhost:${port}`,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket.IO authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid authentication token'));
    }
  });

  // Store user socket connections and notification preferences
  const userSockets = new Map();
  const userNotificationRooms = new Map(); // userId -> Set of notification rooms

  io.on('connection', (socket) => {
    
    // Store user socket for later use
    userSockets.set(socket.userId, socket);

    // Join user to their own room for private messages
    socket.join(`user:${socket.userId}`);

    // Handle joining chat rooms
    socket.on('join-chat', (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    // Handle leaving chat rooms
    socket.on('leave-chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    // Handle new message events
    socket.on('message-sent', (data) => {
      // Broadcast to all users in the chat
      socket.to(`chat:${data.chatId}`).emit('new-message', data.message);
      
      // Also emit to the sender for confirmation
      socket.emit('message-confirmed', data.message);
    });

    // Handle message read events
    socket.on('message-read', (data) => {
      // Broadcast to chat participants that message was read
      socket.to(`chat:${data.chatId}`).emit('message-read-update', {
        messageId: data.messageId,
        readBy: {
          id: socket.userId,
          readAt: new Date().toISOString()
        }
      });
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      socket.to(`chat:${data.chatId}`).emit('user-typing', {
        userId: socket.userId,
        chatId: data.chatId
      });
    });

    socket.on('typing-stop', (data) => {
      socket.to(`chat:${data.chatId}`).emit('user-stop-typing', {
        userId: socket.userId,
        chatId: data.chatId
      });
    });

    // Handle online status
    socket.on('user-online', () => {
      socket.broadcast.emit('user-status-update', {
        userId: socket.userId,
        status: 'online'
      });
    });

    // ========== NOTIFICATION HANDLERS ==========

    // Handle joining notification rooms based on user roles
    socket.on('join-notifications', (data) => {
      const { roles } = data;
      const userId = socket.userId;
      
      // Store user's notification rooms
      const userRooms = new Set();
      
      roles.forEach(role => {
        const roomName = `notifications:${role}`;
        socket.join(roomName);
        userRooms.add(roomName);
      });
      
      // Also join user-specific notification room
      const userRoom = `notifications:user:${userId}`;
      socket.join(userRoom);
      userRooms.add(userRoom);
      
      userNotificationRooms.set(userId, userRooms);
    });

    // Handle marking notification as read
    socket.on('mark-notification-read', (data) => {
      const { notificationId } = data;
      
      // Broadcast to all clients that this notification was read by this user
      // This can be used for read receipt indicators
      socket.broadcast.emit('notification-read', {
        notificationId,
        readBy: socket.userId,
        readAt: new Date().toISOString()
      });
    });

    // Handle getting unread notification count
    socket.on('get-unread-count', async () => {
      try {
        // In a real implementation, you would query the database
        // For now, we'll emit a placeholder count
        socket.emit('unread-count', { count: 0 });
      } catch (error) {
        console.error('Error getting unread count:', error);
        socket.emit('unread-count', { count: 0 });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      userSockets.delete(socket.userId);
      userNotificationRooms.delete(socket.userId);
      
      // Broadcast that user is offline
      socket.broadcast.emit('user-status-update', {
        userId: socket.userId,
        status: 'offline'
      });
    });
  });

  // ========== NOTIFICATION BROADCASTING FUNCTIONS ==========

  /**
   * Broadcast a notification to target users based on roles and specific targeting
   */
  function broadcastNotification(notification) {
    
    // Broadcast to role-based rooms
    notification.targetRoles.forEach(role => {
      const roomName = `notifications:${role}`;
      io.to(roomName).emit('new-notification', notification);
    });

    // Broadcast to specific users if targeted
    if (notification.targetUsers && notification.targetUsers.length > 0) {
      notification.targetUsers.forEach(userId => {
        const userRoom = `notifications:user:${userId}`;
        io.to(userRoom).emit('new-notification', notification);
      });
    }

    // Broadcast to specific classes if targeted
    if (notification.targetClasses && notification.targetClasses.length > 0) {
      notification.targetClasses.forEach(classId => {
        const classRoom = `notifications:class:${classId}`;
        io.to(classRoom).emit('new-notification', notification);
      });
    }
  }

  /**
   * Send notification to specific user
   */
  function sendNotificationToUser(userId, notification) {
    const userSocket = userSockets.get(userId);
    if (userSocket) {
      userSocket.emit('new-notification', notification);
    } else {
      // In a real implementation, you would store this in a database
      // for delivery when the user comes online
    }
  }

  /**
   * Update unread count for a user
   */
  function updateUnreadCount(userId, count) {
    const userSocket = userSockets.get(userId);
    if (userSocket) {
      userSocket.emit('unread-count', { count });
    }
  }

  // Make notification functions available globally for API routes
  global.socketNotifications = {
    broadcastNotification,
    sendNotificationToUser,
    updateUnreadCount,
    userSockets,
    io
  };

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
    });
});