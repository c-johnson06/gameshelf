import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';
import User from '../models/User.js';

interface AuthenticatedSocket extends Socket {
    userId?: number;
    username?: string;
}

export const setupSocket = (io: SocketServer) => {
    // Authentication middleware for Socket.io
    io.use(async (socket: any, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, env.JWT_SECRET) as any;
            const user = await User.findByPk(decoded.userId);

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.userId = user.id;
            socket.username = user.username;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`👤 User ${socket.username} connected`);

        // Join user to their personal room for notifications
        socket.join(`user:${socket.userId}`);

        // Game activity events
        socket.on('game:status_change', async (data) => {
            // Broadcast to friends when user changes game status
            socket.broadcast.emit('activity:game_status', {
                userId: socket.userId,
                username: socket.username,
                gameId: data.gameId,
                gameName: data.gameName,
                status: data.status,
                timestamp: new Date()
            });
        });

        socket.on('game:review_posted', async (data) => {
            // Broadcast new review to interested users
            socket.broadcast.emit('activity:new_review', {
                userId: socket.userId,
                username: socket.username,
                gameId: data.gameId,
                gameName: data.gameName,
                rating: data.rating,
                timestamp: new Date()
            });
        });

        // User presence
        socket.on('user:online', () => {
            socket.broadcast.emit('user:status', {
                userId: socket.userId,
                username: socket.username,
                status: 'online'
            });
        });

        socket.on('disconnect', () => {
            console.log(`👋 User ${socket.username} disconnected`);
            socket.broadcast.emit('user:status', {
                userId: socket.userId,
                username: socket.username,
                status: 'offline'
            });
        });

        // Real-time chat for game discussions
        socket.on('chat:join_game', (gameId) => {
            socket.join(`game:${gameId}`);
        });

        socket.on('chat:leave_game', (gameId) => {
            socket.leave(`game:${gameId}`);
        });

        socket.on('chat:message', (data) => {
            io.to(`game:${data.gameId}`).emit('chat:new_message', {
                userId: socket.userId,
                username: socket.username,
                message: data.message,
                gameId: data.gameId,
                timestamp: new Date()
            });
        });
    });
};