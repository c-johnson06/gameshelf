import { Router } from 'express';
import type{ Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Game from './models/Game.js';
import UserGame from './models/UserGame.js';
import axios from 'axios';

const router = Router();

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req: Request, res: Response, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        (req as any).user = user;
        next();
    });
};

router.post('/register', async(req: Request, res: Response) => {
    try{
        const { email, username, password} = req.body;

        if(!email || !username || !password){
            return res.status(400).json({message: 'Email, username, and password are required.'});
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({message: 'Password must be at least 6 characters long.'});
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({message: 'Please provide a valid email address.'});
        }

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
        console.error('Error during registration:', error);
        res.status(500).json({message: 'Internal server error.'});
    }
});

router.post('/login', async(req: Request, res: Response) => {
    try{
        const { username, password } = req.body;

        if(!username || !password){
            return res.status(400).json({message: 'Username and password are required.'});
        }

        const user = await User.findOne({where: {username}});
        if(!user){
            return res.status(401).json({message: 'Invalid username or password.'});
        }

        // Debug logging
        console.log('User found:', { id: user.id, username: user.username });
        console.log('Password hash exists:', !!user.passwordHash);

        if (!user.passwordHash) {
            console.error('Password hash is missing for user:', user.username);
            return res.status(401).json({message: 'Invalid username or password.'});
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if(!isMatch){
            return res.status(401).json({message: 'Invalid username or password.'});
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' } // Token expires in 7 days
        );

        res.status(200).json({
            message: 'Login successful.',
            token,
            userId: user.id,
            username: user.username
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({message: 'Internal server error.'});
    }
});

// Verify token endpoint
router.get('/verify', authenticateToken, async(req: Request, res: Response) => {
    try {
        const user = await User.findByPk((req as any).user.userId, {
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
        console.error('Error verifying token:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/search', async(req: Request, res: Response) => {
    try{
        const { query } = req.query;

        if(!query || typeof query !== 'string'){
            return res.status(400).json({message: 'Query parameter is required.'});
        }

        const apiKey = process.env.RAWG_API_KEY;
        const response = await axios.get(`https://api.rawg.io/api/games`, {
            params: {
                key: apiKey,
                search: query,
                page_size: 12
            }
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
        console.error('Error during game search:', error);
        res.status(500).json({message: 'Internal server error.'});
    }
});

router.post('/users/:userId/games', authenticateToken, async(req: Request, res: Response) => {
    try{
        const { userId } = req.params;
        const gameData = req.body;

        // Validate userId parameter
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({message: 'Invalid user ID.'});
        }

        // Check if the authenticated user matches the requested userId
        if ((req as any).user.userId !== parseInt(userId)) {
            return res.status(403).json({message: 'Access denied. You can only modify your own library.'});
        }

        const user = await User.findByPk(userId);
        if(!user){
            return res.status(404).json({message: 'User not found.'});
        }

        // Check if game already exists in user's library
        const existingUserGame = await UserGame.findOne({
            where: {
                userId: parseInt(userId),
                gameId: gameData.id
            }
        });

        if (existingUserGame) {
            return res.status(409).json({message: 'Game already in your library.'});
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
        
        await UserGame.create({
            userId: parseInt(userId),
            gameId: game.id,
            playStatus: 'plan-to-play'
        });

        res.status(201).json({message: 'Game added to your library successfully.'});

    } catch (error) {
        console.error('Error adding game to user library:', error);
        return res.status(500).json({message: 'Internal server error.'});
    }
});

router.get('/users/:userId/games', authenticateToken, async(req: Request, res: Response) => {
    try{
        const { userId } = req.params;

        // Validate userId parameter
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({message: 'Invalid user ID.'});
        }

        // Check if the authenticated user matches the requested userId
        if ((req as any).user.userId !== parseInt(userId)) {
            return res.status(403).json({message: 'Access denied. You can only view your own library.'});
        }

        const user = await User.findByPk(userId, {
            include: [{
                model: Game,
                through: {
                    attributes: ['playStatus', 'personalRating', 'review']
                }
            }]
        });

        if(!user){
            return res.status(404).json({message: 'User not found.'});
        }

        res.status(200).json((user as any).Games || []);

    } catch (error) {
        console.error('Error fetching user games:', error);
        res.status(500).json({message: 'Internal server error.'});
    }
});

router.patch('/users/:userId/games/:gameId', authenticateToken, async(req: Request, res: Response) => {
    try{
        const { userId, gameId } = req.params;
        const { playStatus, personalRating, review } = req.body;

        // Validate parameters
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({message: 'Invalid user ID.'});
        }
        if (!gameId || isNaN(parseInt(gameId))) {
            return res.status(400).json({message: 'Invalid game ID.'});
        }

        // Check if the authenticated user matches the requested userId
        if ((req as any).user.userId !== parseInt(userId)) {
            return res.status(403).json({message: 'Access denied. You can only modify your own library.'});
        }

        const userGame = await UserGame.findOne({where: {userId, gameId}});
        if(!userGame){
            return res.status(404).json({message: 'Game not found in your library.'});
        }

        if(playStatus){
            userGame.playStatus = playStatus;
        }
        if(personalRating !== undefined){
            userGame.personalRating = personalRating;
        }
        if(review !== undefined){
            userGame.review = review;
        }

        await userGame.save();
        res.status(200).json({message: 'Game updated successfully.'});

    } catch (error) {
        console.error('Error updating user game:', error);
        res.status(500).json({message: 'Internal server error.'});
    }
});

router.delete('/users/:userId/games/:gameId', authenticateToken, async(req: Request, res: Response) => {
    try{
        const { userId, gameId } = req.params;

        // Validate parameters
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({message: 'Invalid user ID.'});
        }
        if (!gameId || isNaN(parseInt(gameId))) {
            return res.status(400).json({message: 'Invalid game ID.'});
        }

        // Check if the authenticated user matches the requested userId
        if ((req as any).user.userId !== parseInt(userId)) {
            return res.status(403).json({message: 'Access denied. You can only modify your own library.'});
        }

        const userGame = await UserGame.findOne({where: {userId, gameId}});
        if(!userGame){
            return res.status(404).json({message: 'Game not found in your library.'});
        }

        await userGame.destroy();
        res.status(200).json({message: 'Game removed from your library successfully.'});

    } catch (error) {
        console.error('Error removing game from user library:', error);
        res.status(500).json({message: 'Internal server error.'});
    }
});

export default router;