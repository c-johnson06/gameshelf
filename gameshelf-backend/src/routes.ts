import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
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

// FIXED: Game details route with proper manual join
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

        // FIXED: Get user reviews manually without include
        const userGames = await UserGame.findAll({
            where: { gameId: gameIdNum }
        });

        // Get users separately and create the reviews manually
        const reviews: any[] = [];
        for (const userGame of userGames) {
            if (userGame.review) {
                const user = await User.findByPk(userGame.userId, {
                    attributes: ['id', 'username']
                });
                
                if (user) {
                    reviews.push({
                        userId: user.id,
                        username: user.username,
                        rating: userGame.personalRating,
                        review: userGame.review,
                        updatedAt: userGame.updatedAt
                    });
                }
            }
        }

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
        console.error('Error fetching game details:', error);
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
            personalRating: gameData.personalRating || null,
            achievements: [],
            tags: []
        });

        res.status(201).json({ 
            message: 'Game added to your library successfully', 
            userGame 
        });

    } catch (error) {
        next(error);
    }
});

// FIXED: Get user games with manual join
router.get('/users/:userId/games', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;

        if(!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        if (req.user?.userId !== parseInt(userId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get user games first
        const userGames = await UserGame.findAll({
            where: { userId: parseInt(userId) }
        });

        // Then get the games manually
        const games: any[] = [];
        for (const userGame of userGames) {
            const game = await Game.findByPk(userGame.gameId);
            if (game) {
                games.push({
                    id: game.id,
                    name: game.name,
                    released: game.releaseDate,
                    background_image: game.backgroundImage,
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
                });
            }
        }

        res.status(200).json(games);

    } catch (error) {
        console.error('Error fetching user games:', error);
        next(error);
    }
});

// Update user game
router.patch('/users/:userId/games/:gameId', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { userId, gameId } = req.params;
        const { playStatus, personalRating, review } = req.body;

        if (!userId || isNaN(parseInt(userId)) || !gameId || isNaN(parseInt(gameId))) {
            return res.status(400).json({ message: 'Invalid user or game ID' });
        }
        if (req.user?.userId !== parseInt(userId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const userGame = await UserGame.findOne({
            where: { userId: parseInt(userId), gameId: parseInt(gameId) }
        });
        if (!userGame) {
            return res.status(404).json({ message: 'Game not found in your library' });
        }

        if (playStatus) userGame.playStatus = playStatus;
        if (personalRating !== undefined) userGame.personalRating = personalRating;
        if (review !== undefined) userGame.review = review;

        await userGame.save();
        res.status(200).json({ message: 'Game updated successfully', userGame });

    } catch (error) {
        console.error('Error updating user game:', error);
        next(error);
    }
});

// Delete user game
router.delete('/users/:userId/games/:gameId', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { userId, gameId } = req.params;

        if (!userId || isNaN(parseInt(userId)) || !gameId || isNaN(parseInt(gameId))) {
            return res.status(400).json({ message: 'Invalid user or game ID' });
        }
        if (req.user?.userId !== parseInt(userId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const userGame = await UserGame.findOne({
            where: { userId: parseInt(userId), gameId: parseInt(gameId) }
        });
        if (!userGame) {
            return res.status(404).json({ message: 'Game not found in your library' });
        }

        await userGame.destroy();
        res.status(200).json({ message: 'Game removed from your library successfully' });

    } catch (error) {
        console.error('Error removing game from user library:', error);
        next(error);
    }
});

// User profile route
router.get('/users/:userId/profile', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;

        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'createdAt']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userGames = await UserGame.findAll({
            where: { userId: parseInt(userId) }
        });

        const totalGames = userGames.length;
        const completedGames = userGames.filter(ug => ug.playStatus === 'completed').length;
        const currentlyPlaying = userGames.filter(ug => ug.playStatus === 'playing').length;
        
        const ratings = userGames
            .map(ug => ug.personalRating)
            .filter(r => r !== null) as number[];
        
        const averageRating = ratings.length > 0 
            ? ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length 
            : null;

        res.status(200).json({
            ...user.toJSON(),
            totalGames,
            completedGames,
            currentlyPlaying,
            averageRating
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        next(error);
    }
});

// Update user profile details
router.patch('/users/:userId/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const { bio, avatar, preferences } = req.body; // Destructure without banner

        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        if (req.user?.userId !== parseInt(userId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.setProfile({ bio, avatar, preferences });

        res.status(200).json({ message: 'Profile updated successfully', user: user.toSafeJSON() });
    } catch (error) {
        next(error);
    }
});

// Related games route
router.get('/games/:gameId/related', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { gameId } = req.params;
        if(!gameId) {
            return res.status(400).json({ message: 'Game ID is required' });
        }
        if (!RAWG_API_KEY) {
            return res.status(500).json({ message: 'Game service temporarily unavailable' });
        }

        // Try to get game series first, fallback to genre-based recommendations
        try {
            const response = await axios.get(`https://api.rawg.io/api/games/${gameId}/game-series`, {
                params: { key: RAWG_API_KEY },
                timeout: 10000
            });

            if (response.data.results && response.data.results.length > 0) {
                const games = response.data.results.slice(0, 6).map((game: any) => ({
                    id: game.id,
                    name: game.name,
                    released: game.released,
                    background_image: game.background_image,
                    rating: game.rating,
                    platforms: game.platforms ? game.platforms.map((p: any) => p.platform.name) : [],
                    genres: game.genres ? game.genres.map((g: any) => g.name) : []
                }));

                return res.status(200).json({ games });
            }
        } catch (seriesError) {
            console.log('Series API failed, trying genre-based recommendations');
        }

        // Fallback: get current game details and find similar games by genre
        const gameResponse = await axios.get(`https://api.rawg.io/api/games/${gameId}`, {
            params: { key: RAWG_API_KEY }
        });

        const currentGame = gameResponse.data;
        const genreNames = currentGame.genres?.slice(0, 2).map((g: any) => g.name).join(',');

        if (genreNames) {
            const similarResponse = await axios.get(`https://api.rawg.io/api/games`, {
                params: {
                    key: RAWG_API_KEY,
                    genres: genreNames,
                    page_size: 8,
                    ordering: '-rating'
                },
                timeout: 10000
            });

            const games = similarResponse.data.results
                .filter((game: any) => game.id !== parseInt(gameId))
                .slice(0, 6)
                .map((game: any) => ({
                    id: game.id,
                    name: game.name,
                    released: game.released,
                    background_image: game.background_image,
                    rating: game.rating,
                    platforms: game.platforms ? game.platforms.map((p: any) => p.platform.name) : [],
                    genres: game.genres ? game.genres.map((g: any) => g.name) : []
                }));

            return res.status(200).json({ games });
        }

        // If no genres found, return empty array
        res.status(200).json({ games: [] });

    } catch (error) {
        console.error('Error fetching related games:', error);
        res.status(200).json({ games: [] }); // Return empty array instead of error
    }
});

// Add this route to search for users
router.get('/users/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query } = req.query;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ message: 'Query parameter is required' });
        }

        const users = await User.findAll({
            where: {
                username: {
                    [Op.like]: `%${query}%`
                }
            },
            attributes: ['id', 'username', 'avatar', 'bio'],
            limit: 10
        });

        res.status(200).json({ users });
    } catch (error) {
        next(error);
    }
});

export default router;