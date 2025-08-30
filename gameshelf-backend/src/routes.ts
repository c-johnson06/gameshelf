import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Game from './models/Game.js';
import UserGame from './models/UserGame.js';
import axios from 'axios';

const router = Router();

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const RAWG_API_KEY = process.env.RAWG_API_KEY;

if (!RAWG_API_KEY) {
    console.warn('⚠️  RAWG_API_KEY not found in environment variables');
}

// Custom interface to extend Request object
interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        username: string;
    };
}

// Simple validation middleware
const validateRegister = (req: Request, res: Response, next: NextFunction) => {
    const { email, username, password } = req.body;
    
    if (!email || !username || !password) {
        return res.status(400).json({ message: 'Email, username, and password are required' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    next();
};

const validateLogin = (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    
    next();
};

// JWT middleware
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Optional authentication middleware
const addUserIfAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
            if (!err) {
                req.user = user;
            }
        });
    }
    next();
};

// Auth routes
router.post('/register', validateRegister, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, username, password } = req.body;

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already taken' });
        }

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            email,
            username,
            passwordHash
        });

        res.status(201).json({
            message: 'User registered successfully',
            userId: newUser.id
        });

    } catch (error) {
        next(error);
    }
});

router.post('/login', validateLogin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ where: { username } });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            userId: user.id,
            username: user.username
        });

    } catch (error) {
        next(error);
    }
});

router.get('/verify', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const user = await User.findByPk(req.user.userId, {
            attributes: ['id', 'username', 'email']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Token is valid',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
});

// Game search route
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query } = req.query;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ message: 'Query parameter is required' });
        }

        if (!RAWG_API_KEY) {
            return res.status(500).json({ 
                message: 'Game service temporarily unavailable - API key not configured' 
            });
        }

        console.log(`🔍 Searching for games with query: "${query}"`);
        
        const response = await axios.get(`https://api.rawg.io/api/games`, {
            params: { 
                key: RAWG_API_KEY, 
                search: query, 
                page_size: 12 
            },
            timeout: 10000
        });

        const games = response.data.results.map((game: any) => ({
            id: game.id,
            name: game.name,
            released: game.released,
            background_image: game.background_image,
            rating: game.rating,
            platforms: game.platforms ? game.platforms.map((p: any) => p.platform.name) : [],
            genres: game.genres ? game.genres.map((g: any) => g.name) : []
        }));

        console.log(`✅ Found ${games.length} games for query: "${query}"`);
        res.status(200).json({ games });

    } catch (error: any) {
        console.error('❌ Search error:', error.message);
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({ message: 'Search request timed out' });
        }
        next(error);
    }
});

// Test route
router.get('/test', (req: Request, res: Response) => {
    res.json({ 
        message: 'API is working!', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Game details route
router.get('/games/:gameId', addUserIfAuthenticated, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { gameId } = req.params;
        if(!gameId) {
            return res.status(400).json({ message: 'Game ID is required' });
        }

        const gameIdNum = parseInt(gameId, 10);
        if (isNaN(gameIdNum)) {
            return res.status(400).json({ message: 'Invalid game ID' });
        }

        if (!RAWG_API_KEY) {
            return res.status(500).json({ message: 'Game service temporarily unavailable' });
        }

        const rawgResponse = await axios.get(`https://api.rawg.io/api/games/${gameId}`, {
            params: { key: RAWG_API_KEY },
            timeout: 10000
        });
        
        const gameDetails = rawgResponse.data;

        // Get user reviews and ratings
        const userGames = await UserGame.findAll({
            where: { gameId: gameIdNum },
            include: [{ model: User, attributes: ['id', 'username'] }]
        });

        const reviews = userGames
            .filter(ug => ug.review)
            .map(ug => ({
                userId: (ug as any).User.id,
                username: (ug as any).User.username,
                rating: ug.personalRating,
                review: ug.review,
                updatedAt: ug.updatedAt
            }));

        const ratings = userGames.map(ug => ug.personalRating).filter(r => r !== null) as number[];
        const averageRating = ratings.length > 0 ? ratings.reduce((acc, cur) => acc + cur, 0) / ratings.length : null;

        let userGameStatus: {
            playStatus: string;
            personalRating: number | null;
            review: string | null;
        } | null = null;
        
        if (req.user) {
            const userGame = await UserGame.findOne({ 
                where: { userId: req.user.userId, gameId: gameIdNum }
            });
            if (userGame) {
                userGameStatus = {
                    playStatus: userGame.playStatus,
                    personalRating: userGame.personalRating,
                    review: userGame.review
                };
            }
        }

        res.status(200).json({
            details: {
                id: gameDetails.id,
                name: gameDetails.name,
                description_raw: gameDetails.description_raw,
                released: gameDetails.released,
                background_image: gameDetails.background_image,
                website: gameDetails.website,
                rating: gameDetails.rating,
                platforms: gameDetails.platforms?.map((p: any) => p.platform.name) || [],
                genres: gameDetails.genres?.map((g: any) => g.name) || [],
                developers: gameDetails.developers?.map((d: any) => d.name) || [],
            },
            reviews,
            averageRating,
            userGameStatus
        });

    } catch (error) {
        next(error);
    }
});

// User game management routes
router.post('/users/:userId/games', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const gameData = req.body;

        if(!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        if (req.user?.userId !== parseInt(userId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if game already exists in user's library
        const existingUserGame = await UserGame.findOne({
            where: { userId: parseInt(userId), gameId: gameData.id }
        });

        if (existingUserGame) {
            return res.status(409).json({ message: 'Game already exists in your library' });
        }

        const [game] = await Game.findOrCreate({
            where: { id: gameData.id },
            defaults: {
                id: gameData.id,
                name: gameData.name,
                genres: gameData.genres ? gameData.genres.join(', ') : '',
                backgroundImage: gameData.background_image,
                platform: gameData.platforms ? gameData.platforms.join(', ') : '',
                releaseDate: gameData.released ? new Date(gameData.released) : undefined,
                rating: gameData.rating
            }
        });

        const userGame = await UserGame.create({
            userId: parseInt(userId),
            gameId: game.id,
            playStatus: gameData.playStatus || 'plan-to-play',
            personalRating: gameData.personalRating || null
        });

        res.status(201).json({ 
            message: 'Game added to your library successfully', 
            userGame 
        });

    } catch (error) {
        next(error);
    }
});

// Get user games
router.get('/users/:userId/games', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;

        if(!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        if (req.user?.userId !== parseInt(userId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const userGames = await UserGame.findAll({
            where: { userId: parseInt(userId) },
            include: [{
                model: Game,
                as: 'Game'
            }]
        });

        const games = userGames.map(userGame => {
            const game = (userGame as any).Game;
            return {
                id: game.id,
                name: game.name,
                released: game.releaseDate,
                background_image: game.backgroundImage,
                backgroundImage: game.backgroundImage,
                rating: game.rating,
                platforms: game.platform ? game.platform.split(', ') : [],
                genres: game.genres ? game.genres.split(', ') : [],
                UserGame: {
                    playStatus: userGame.playStatus,
                    personalRating: userGame.personalRating,
                    review: userGame.review,
                    createdAt: userGame.createdAt,
                    updatedAt: userGame.updatedAt
                }
            };
        });

        res.status(200).json(games);

    } catch (error) {
        next(error);
    }
});

// Additional routes can be added here...

export default router;