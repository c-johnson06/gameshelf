import { Router } from 'express';
import type{ Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Game from './models/Game.js';
import UserGame from './models/UserGame.js';
import axios from 'axios';

const router = Router();

router.post('/register', async(req: Request, res: Response) => {
    try{
        const { email, username, password} = req.body;

        if(!email || !username || !password){
            return res.status(400).json({message: 'Email, username, and password are required.'});
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
        })

        res.status(201).json({message: 'User registered successfully.', userId: newUser.id});

    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({message: 'Internal server error.'});
    }
})

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

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if(!isMatch){
            return res.status(401).json({message: 'Invalid username or password.'});
        }

        res.status(200).json({message: 'Login successful.', userId: user.id});

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({message: 'Internal server error.'});
    }
})

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
})

router.post('/users/:userId/games', async(req: Request, res: Response) => {
    try{
        const { userId } = req.params;
        const gameData = req.body;

        const user = await User.findByPk(userId);

        if(!user){
            return res.status(404).json({message: 'User not found.'});
        }
        
        const [game] = await Game.findOrCreate({
            where: { id: gameData.id },
            defaults: {
                name: gameData.name,
                genres: gameData.genres ? gameData.genres.join(', ') : '',
                backgroundImage: gameData.background_image,
                platform: gameData.platforms ? gameData.platforms.join(', ') : '',
                releaseDate: gameData.released ? new Date(gameData.released) : null,
                rating: gameData.rating
            }
        });
        
        await(user as any).addGame(game, {through: { playStatus: 'Want to Play' }});
        res.status(201).json({message: 'Game added to user library.'});
        
    } catch (error) {
        console.error('Error adding game to user library:', error);
        return res.status(500).json({message: 'Internal server error.'});
    }
});

router.get('/users/:userId/games', async(req: Request, res: Response) => {
    try{
        const { userId } = req.params;

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

        res.status(200).json((user as any).games || []);

    } catch (error) {
        console.error('Error fetching user games:', error);
        res.status(500).json({message: 'Internal server error.'});
    }
});

router.patch('/user/:userId/game/:gameId', async(req: Request, res: Response) => {
    try{
        const { userId, gameId } = req.params;
        const { playStatus, personalRating, review } = req.body;

        const userGame = await UserGame.findOne({where: {userId, gameId}});
        if(!userGame){
            return res.status(404).json({message: 'UserGame entry not found.'});
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
        res.status(200).json({message: 'UserGame entry updated successfully.'});

    } catch (error) {
        console.error('Error updating UserGame entry:', error);
        res.status(500).json({message: 'Internal server error.'});
    }
});

export default router;