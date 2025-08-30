import { Router } from 'express';
import type{ Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Game from './models/Game.js';
import UserGame from './models/UserGame.js';
import axios from 'axios';
import { Op } from 'sequelize';
import { sendVerificationEmail, generateVerificationToken } from './services/emailService.js';
import { validateUserRegistration, validateUserLogin } from './middleware/validation.js';

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

// Optional Middleware to add user to request if token is valid
const addUserIfAuthenticated = (req: Request, res: Response, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
            if (!err) {
                (req as any).user = user;
            }
            next();
        });
    } else {
        next();
    }
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

        if (!user.passwordHash) {
            console.error('Password hash is missing for user:', user.username);
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
        console.error('Error during login:', error);
        res.status(500).json({message: 'Internal server error.'});
    }
});

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

router.get('/search', addUserIfAuthenticated, async(req: Request, res: Response) => {
    try{
        const { query } = req.query;

        if(!query || typeof query !== 'string'){
            return res.status(400).json({message: 'Query parameter is required.'});
        }

        const apiKey = process.env.RAWG_API_KEY;
        const response = await axios.get(`https://api.rawg.io/api/games`, {
            params: { key: apiKey, search: query, page_size: 12 }
        });

        let games = response.data.results.map((game: any) => ({
            id: game.id,
            name: game.name,
            released: game.released,
            background_image: game.background_image,
            rating: game.rating,
            platforms: game.platforms ? game.platforms.map((p: any) => p.platform.name) : [],
            genres: game.genres ? game.genres.map((g: any) => g.name) : []
        }));

        if ((req as any).user && games.length > 0) {
            const gameIds = games.map((g: any) => g.id);
            const userGames = await UserGame.findAll({
                where: {
                    userId: (req as any).user.userId,
                    gameId: { [Op.in]: gameIds }
                }
            });
            const userGamesMap = new Map(userGames.map(ug => [ug.gameId, ug]));
            games = games.map((game: any) => ({
                ...game,
                UserGame: userGamesMap.get(game.id) || null
            }));
        }

        res.status(200).json({games});

    } catch (error) {
        console.error('Error during game search:', error);
        res.status(500).json({message: 'Internal server error.'});
    }
});

router.get('/games/:gameId', addUserIfAuthenticated, async (req: Request, res: Response) => {
    try {
        const { gameId } = req.params;
        const apiKey = process.env.RAWG_API_KEY;

        const rawgResponse = await axios.get(`https://api.rawg.io/api/games/${gameId}`, {
            params: { key: apiKey }
        });
        const gameDetails = rawgResponse.data;

        if (!gameId || typeof gameId !== 'string') {
            return res.status(400).json({ message: 'Invalid game ID.' });
        }
        const userGames = await UserGame.findAll({
            where: { gameId: parseInt(gameId) },
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
        
        if ((req as any).user) {
            const userId = (req as any).user.userId;
            const userGame = await UserGame.findOne({ where: { userId, gameId: parseInt(gameId) }});
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
        res.status(500).json({ message: 'Internal server error.' });
    }
});

router.post('/users/:userId/games', authenticateToken, async(req: Request, res: Response) => {
    try{
        const { userId } = req.params;
        const gameData = req.body;

        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({message: 'Invalid user ID.'});
        }
        if ((req as any).user.userId !== parseInt(userId)) {
            return res.status(403).json({message: 'Access denied.'});
        }

        const user = await User.findByPk(userId);
        if(!user){
            return res.status(404).json({message: 'User not found.'});
        }

        const existingUserGame = await UserGame.findOne({
            where: { userId: parseInt(userId), gameId: gameData.id }
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
            playStatus: gameData.playStatus || 'plan-to-play'
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

        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({message: 'Invalid user ID.'});
        }
        if ((req as any).user.userId !== parseInt(userId)) {
            return res.status(403).json({message: 'Access denied.'});
        }
        
        const userWithGames = await User.findByPk(userId, {
            include: [{
                model: Game,
                as: 'Games',
                through: {
                    attributes: ['playStatus', 'personalRating', 'review']
                }
            }]
        });

        if(!userWithGames){
            return res.status(404).json({message: 'User not found.'});
        }

        res.status(200).json((userWithGames as any).Games || []);

    } catch (error) {
        console.error('Error fetching user games:', error);
        res.status(500).json({message: 'Internal server error.'});
    }
});

router.patch('/users/:userId/games/:gameId', authenticateToken, async(req: Request, res: Response) => {
    try{
        const { userId, gameId } = req.params;
        const { playStatus, personalRating, review } = req.body;

        if (!userId || isNaN(parseInt(userId)) || !gameId || isNaN(parseInt(gameId))) {
            return res.status(400).json({message: 'Invalid user or game ID.'});
        }
        if ((req as any).user.userId !== parseInt(userId)) {
            return res.status(403).json({message: 'Access denied.'});
        }

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
        console.error('Error updating user game:', error);
        res.status(500).json({message: 'Internal server error.'});
    }
});

router.delete('/users/:userId/games/:gameId', authenticateToken, async(req: Request, res: Response) => {
    try{
        const { userId, gameId } = req.params;

        if (!userId || isNaN(parseInt(userId)) || !gameId || isNaN(parseInt(gameId))) {
            return res.status(400).json({message: 'Invalid user or game ID.'});
        }
        if ((req as any).user.userId !== parseInt(userId)) {
            return res.status(403).json({message: 'Access denied.'});
        }

        const userGame = await UserGame.findOne({where: {userId: parseInt(userId), gameId: parseInt(gameId)}});
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

router.get('/users/:userId/profile', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'createdAt']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
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
        res.status(500).json({ message: 'Internal server error.' });
    }
});

router.get('/games/:gameId/related', async (req: Request, res: Response) => {
    try {
        const { gameId } = req.params;
        const apiKey = process.env.RAWG_API_KEY;

        const currentGameResponse = await axios.get(`https://api.rawg.io/api/games/${gameId}`, {
            params: { key: apiKey }
        });

        const currentGame = currentGameResponse.data;
        
        const genreIds = currentGame.genres?.map((g: any) => g.id).slice(0, 2).join(',');
        
        let relatedGames = [];
        
        if (genreIds) {
            const relatedResponse = await axios.get(`https://api.rawg.io/api/games`, {
                params: { 
                    key: apiKey,
                    genres: genreIds,
                    page_size: 12,
                    ordering: '-rating'
                }
            });
            if(!gameId) return res.status(400).json({ message: 'Game ID is required.' });
            relatedGames = relatedResponse.data.results
                .filter((game: any) => game.id !== parseInt(gameId))
                .slice(0, 8)
                .map((game: any) => ({
                    id: game.id,
                    name: game.name,
                    released: game.released,
                    background_image: game.background_image,
                    rating: game.rating,
                    platforms: game.platforms ? game.platforms.map((p: any) => p.platform.name) : [],
                    genres: game.genres ? game.genres.map((g: any) => g.name) : []
                }));
        }

        res.status(200).json({ games: relatedGames });

    } catch (error) {
        console.error('Error fetching related games:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

router.delete('/users/:userId/games/:gameId/review', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { userId, gameId } = req.params;

        if (!userId || isNaN(parseInt(userId)) || !gameId || isNaN(parseInt(gameId))) {
            return res.status(400).json({ message: 'Invalid user or game ID.' });
        }
        
        if ((req as any).user.userId !== parseInt(userId)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const userGame = await UserGame.findOne({
            where: { userId: parseInt(userId), gameId: parseInt(gameId) }
        });

        if (!userGame) {
            return res.status(404).json({ message: 'Game not found in your library.' });
        }

        userGame.personalRating = null;
        userGame.review = null;
        await userGame.save();

        res.status(200).json({ 
            message: 'Review deleted successfully.',
            userGame 
        });

    } catch (error) {
        console.error('Error deleting user review:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

router.delete('/users/:userId/games/:gameId/review', authenticateToken, async(req: Request, res: Response) => {
    try {
        const { userId, gameId } = req.params;

        if (!userId || isNaN(parseInt(userId)) || !gameId || isNaN(parseInt(gameId))) {
            return res.status(400).json({ message: 'Invalid user or game ID.' });
        }
        
        if ((req as any).user.userId !== parseInt(userId)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const userGame = await UserGame.findOne({
            where: { userId: parseInt(userId), gameId: parseInt(gameId) }
        });

        if (!userGame) {
            return res.status(404).json({ message: 'Game not found in your library.' });
        }

        userGame.personalRating = null;
        userGame.review = null;
        await userGame.save();

        res.status(200).json({ 
            message: 'Review deleted successfully.',
            userGame 
        });

    } catch (error) {
        console.error('Error deleting user review:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

router.post('/register', validateUserRegistration, async(req: Request, res: Response) => {
    try {
        const { email, username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(409).json({ 
                success: false,
                message: 'Username already taken.' 
            });
        }

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(409).json({ 
                success: false,
                message: 'Email already in use.' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user (unverified)
        const newUser = await User.create({
            email,
            username,
            passwordHash,
            isEmailVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires
        });

        // Send verification email
        try {
            await sendVerificationEmail(email, username, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails, just log it
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            data: {
                userId: newUser.id,
                username: newUser.username,
                email: newUser.email,
                isEmailVerified: false
            }
        });

    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error.' 
        });
    }
});

// Email verification route
router.get('/verify-email/:token', async(req: Request, res: Response) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required.'
            });
        }

        // Find user with this token that hasn't expired
        const user = await User.findOne({
            where: {
                emailVerificationToken: token,
                emailVerificationExpires: {
                    [Op.gt]: new Date() // Token hasn't expired
                }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token.'
            });
        }

        // Mark email as verified
        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now log in.',
            data: {
                userId: user.id,
                username: user.username,
                isEmailVerified: true
            }
        });

    } catch (error) {
        console.error('Error during email verification:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

// Resend verification email route
router.post('/resend-verification', async(req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required.'
            });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email address.'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified.'
            });
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = verificationExpires;
        await user.save();

        // Send verification email
        await sendVerificationEmail(user.email, user.username, verificationToken);

        res.status(200).json({
            success: true,
            message: 'Verification email sent! Please check your inbox.'
        });

    } catch (error) {
        console.error('Error resending verification email:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

// Updated login route to check email verification
router.post('/login', validateUserLogin, async(req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid username or password.' 
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email address before logging in.',
                code: 'EMAIL_NOT_VERIFIED',
                data: {
                    email: user.email,
                    canResendVerification: true
                }
            });
        }

        if (!user.passwordHash) {
            console.error('Password hash is missing for user:', user.username);
            return res.status(401).json({ 
                success: false,
                message: 'Invalid username or password.' 
            });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid username or password.' 
            });
        }

        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                isEmailVerified: user.isEmailVerified
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    isEmailVerified: user.isEmailVerified
                }
            }
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error.' 
        });
    }
});

export default router;
