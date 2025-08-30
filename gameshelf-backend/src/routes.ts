import { Router } from 'express';
import type{ Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Game from './models/Game.js';
import UserGame from './models/UserGame.js';
import axios from 'axios';
import { authRateLimiter } from './middleware/security.js';
import { validateRegister, validateLogin, validateUserAndGameIds, validateUpdateUserGame } from './middleware/validation.js';

const router = Router();

// Ensure JWT_SECRET and RAWG_API_KEY are loaded from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const RAWG_API_KEY = process.env.RAWG_API_KEY;

if (!JWT_SECRET || !RAWG_API_KEY) {
    throw new Error('Missing critical environment variables: JWT_SECRET or RAWG_API_KEY');
}

// Custom interface to extend Request object
interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        username: string;
    };
}


// Middleware to verify JWT token
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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

// Optional Middleware to add user to request if token is valid
const addUserIfAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
            if (!err) {
                req.user = user;
            }
            next();
        });
    } else {
        next();
    }
};


router.post('/register', authRateLimiter, validateRegister, async(req: Request, res: Response, next: NextFunction) => {
    try{
        const { email, username, password} = req.body;

        const existingUser = await User.findOne({where: {username}});
        if(existingUser){
            return res.status(409).json({message: 'Username already taken.'});
        }

        const existingEmail = await User.findOne({where: {email}});
        if(existingEmail){
            return res.status(409).json({message: 'Email already in use.'});
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            email,
            username,
            passwordHash
        });

        res.status(201).json({
            message: 'User registered successfully.',
            userId: newUser.id
        });

    } catch (error) {
        next(error);
    }
});

router.post('/login', authRateLimiter, validateLogin, async(req: Request, res: Response, next: NextFunction) => {
    try{
        const { username, password } = req.body;

        const user = await User.findOne({where: {username}});
        if(!user || !user.passwordHash){
            return res.status(401).json({message: 'Invalid username or password.'});
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if(!isMatch){
            return res.status(401).json({message: 'Invalid username or password.'});
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful.',
            token,
            userId: user.id,
            username: user.username
        });

    } catch (error) {
        next(error);
    }
});

router.get('/verify', authenticateToken, async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

router.get('/search', async(req: Request, res: Response, next: NextFunction) => {
    try{
        const { query } = req.query;

        if(!query || typeof query !== 'string'){
            return res.status(400).json({message: 'Query parameter is required.'});
        }

        const response = await axios.get(`https://api.rawg.io/api/games`, {
            params: { key: RAWG_API_KEY, search: query, page_size: 12 }
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

        res.status(200).json({games});

    } catch (error) {
       next(error);
    }
});

router.get('/games/:gameId', addUserIfAuthenticated, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { gameId } = req.params;

        if(!gameId) return res.status(400).json({message: 'User ID is required.'});

        const gameIdNum = parseInt(gameId, 10);
        if (isNaN(gameIdNum)) {
            return res.status(400).json({ message: 'Invalid game ID.' });
        }

        const rawgResponse = await axios.get(`https://api.rawg.io/api/games/${gameId}`, {
            params: { key: RAWG_API_KEY }
        });
        const gameDetails = rawgResponse.data;

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
            const userId = req.user.userId;
            const userGame = await UserGame.findOne({ where: { userId, gameId: gameIdNum }});
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

router.post('/users/:userId/games', authenticateToken, validateUserAndGameIds, async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try{
        const { userId } = req.params;
        const gameData = req.body;

        if(!userId) return res.status(400).json({message: 'User ID is required.'});

        if (req.user?.userId !== parseInt(userId)) {
            return res.status(403).json({message: 'Access denied.'});
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

        if(!userId) return res.status(400).json({message: 'User ID is required.'});

        const userGame = await UserGame.create({
            userId: parseInt(userId),
            gameId: game.id,
            playStatus: gameData.playStatus || 'plan-to-play',
            personalRating: gameData.personalRating || null
        });

        res.status(201).json({message: 'Game added to your library successfully.', userGame });

    } catch (error) {
        next(error)
    }
});

router.get('/users/:userId/games', authenticateToken, async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try{
        const { userId } = req.params;

        if(!userId) return res.status(400).json({message: 'User ID is required.'});

        if (req.user?.userId !== parseInt(userId)) {
            return res.status(403).json({message: 'Access denied.'});
        }
        
        const user = await User.scope('withGames').findByPk(userId);

        if(!user){
            return res.status(404).json({message: 'User not found.'});
        }

        res.status(200).json((user as any).Games || []);

    } catch (error) {
       next(error);
    }
});

router.patch('/users/:userId/games/:gameId', authenticateToken, validateUserAndGameIds, validateUpdateUserGame, async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try{
        const { userId, gameId } = req.params;
        const { playStatus, personalRating, review } = req.body;

        if(!userId) return res.status(400).json({message: 'User ID is required.'});

        if (req.user?.userId !== parseInt(userId)) {
            return res.status(403).json({message: 'Access denied.'});
        }

        if(!gameId) return res.status(400).json({message: 'User ID is required.'});

        const userGame = await UserGame.findOne({where: {userId: parseInt(userId), gameId: parseInt(gameId)}});
        if(!userGame){
            return res.status(404).json({message: 'Game not found in your library.'});
        }

        if(playStatus) userGame.playStatus = playStatus;
        if(personalRating !== undefined) userGame.personalRating = personalRating;
        if(review !== undefined) userGame.review = review;

        await userGame.save();
        res.status(200).json({message: 'Game updated successfully.', userGame });

    } catch (error) {
        next(error);
    }
});

router.delete('/users/:userId/games/:gameId', authenticateToken, validateUserAndGameIds, async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try{
        const { userId, gameId } = req.params;

        if(!userId) return res.status(400).json({message: 'User ID is required.'});

        if (req.user?.userId !== parseInt(userId)) {
            return res.status(403).json({message: 'Access denied.'});
        }

        if(!gameId) return res.status(400).json({message: 'User ID is required.'});

        const userGame = await UserGame.findOne({where: {userId: parseInt(userId), gameId: parseInt(gameId)}});
        if(!userGame){
            return res.status(404).json({message: 'Game not found in your library.'});
        }

        await userGame.destroy();
        res.status(200).json({message: 'Game removed from your library successfully.'});

    } catch (error) {
        next(error);
    }
});

export default router;