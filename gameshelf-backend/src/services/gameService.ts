import axios from 'axios';
import { cache } from './cache.js';
import { env } from '../config/environment.js';
import Game from '../models/Game.js';

interface RawgGame {
    id: number;
    name: string;
    slug: string;
    description_raw: string;
    background_image: string;
    rating: number;
    rating_count: number;
    released: string;
    platforms: Array<{ platform: { name: string } }>;
    genres: Array<{ name: string }>;
    developers: Array<{ name: string }>;
    publishers: Array<{ name: string }>;
    website: string;
    metacritic: number;
    esrb_rating: { name: string } | null;
    tags: Array<{ name: string }>;
}

class GameService {
    private apiKey: string;
    private baseURL = 'https://api.rawg.io/api';

    constructor() {
        this.apiKey = env.RAWG_API_KEY;
    }

    async searchGames(query: string, page = 1, pageSize = 12): Promise<any> {
        const cacheKey = `search:${query}:${page}:${pageSize}`;
        
        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await axios.get(`${this.baseURL}/games`, {
                params: {
                    key: this.apiKey,
                    search: query,
                    page,
                    page_size: pageSize,
                    ordering: '-rating'
                },
                timeout: 10000
            });

            const result = {
                games: response.data.results.map(this.transformGame),
                pagination: {
                    page,
                    pageSize,
                    total: response.data.count,
                    totalPages: Math.ceil(response.data.count / pageSize)
                }
            };

            // Cache for 1 hour
            await cache.set(cacheKey, result, 3600);
            return result;

        } catch (error: any) {
            console.error('Game search error:', error.message);
            throw new Error('Failed to search games');
        }
    }

    async getGameDetails(gameId: number): Promise<any> {
        const cacheKey = `game:${gameId}`;
        
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        try {
            const [gameResponse, screenshotsResponse] = await Promise.all([
                axios.get(`${this.baseURL}/games/${gameId}`, {
                    params: { key: this.apiKey }
                }),
                axios.get(`${this.baseURL}/games/${gameId}/screenshots`, {
                    params: { key: this.apiKey }
                })
            ]);

            const gameDetails = this.transformGame(gameResponse.data);

            // Cache for 6 hours
            await cache.set(cacheKey, gameDetails, 21600);
            return gameDetails;

        } catch (error: any) {
            console.error(`Game details error for ID ${gameId}:`, error.message);
            throw new Error('Failed to fetch game details');
        }
    }

    async getRelatedGames(gameId: number): Promise<any[]> {
        const cacheKey = `related:${gameId}`;
        
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        try {
            // Get current game to find similar ones
            const currentGame = await this.getGameDetails(gameId);
            const genreNames = currentGame.genres.slice(0, 2);
            
            if (genreNames.length === 0) return [];

            const response = await axios.get(`${this.baseURL}/games`, {
                params: {
                    key: this.apiKey,
                    genres: genreNames.join(','),
                    page_size: 8,
                    ordering: '-rating'
                }
            });

            const related = response.data.results
                .filter((game: any) => game.id !== gameId)
                .slice(0, 6)
                .map(this.transformGame);

            await cache.set(cacheKey, related, 3600);
            return related;

        } catch (error: any) {
            console.error(`Related games error for ID ${gameId}:`, error.message);
            return [];
        }
    }

    async getTrendingGames(): Promise<any[]> {
        const cacheKey = 'trending:games';
        
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const response = await axios.get(`${this.baseURL}/games`, {
                params: {
                    key: this.apiKey,
                    dates: `${thirtyDaysAgo.toISOString().split('T')[0]},${new Date().toISOString().split('T')[0]}`,
                    ordering: '-added',
                    page_size: 12
                }
            });

            const trending = response.data.results.map(this.transformGame);
            await cache.set(cacheKey, trending, 1800); // 30 minutes cache
            return trending;

        } catch (error: any) {
            console.error('Trending games error:', error.message);
            return [];
        }
    }

    private transformGame(rawgGame: any) {
        return {
            id: rawgGame.id,
            name: rawgGame.name,
            slug: rawgGame.slug,
            description: rawgGame.description_raw,
            background_image: rawgGame.background_image,
            rating: rawgGame.rating,
            ratingsCount: rawgGame.ratings_count,
            released: rawgGame.released,
            platforms: rawgGame.platforms?.map((p: any) => p.platform.name) || [],
            genres: rawgGame.genres?.map((g: any) => g.name) || [],
            developers: rawgGame.developers?.map((d: any) => d.name) || [],
            publishers: rawgGame.publishers?.map((p: any) => p.name) || [],
            website: rawgGame.website,
            metacritic: rawgGame.metacritic,
            esrbRating: rawgGame.esrb_rating?.name,
            tags: rawgGame.tags?.slice(0, 10).map((t: any) => t.name) || []
        };
    }

    async syncGameToDatabase(gameData: any): Promise<Game> {
        return Game.findOrCreate({
            where: { id: gameData.id },
            defaults: {
                id: gameData.id,
                name: gameData.name,
                slug: gameData.slug,
                description: gameData.description,
                genres: gameData.genres?.join(', '),
                backgroundImage: gameData.background_image,
                screenshots: gameData.screenshots || [],
                platform: gameData.platforms?.join(', '),
                releaseDate: gameData.released ? new Date(gameData.released) : undefined,
                rating: gameData.rating,
                ratingsCount: gameData.ratingsCount,
                metacriticScore: gameData.metacritic,
                developers: gameData.developers?.join(', '),
                publishers: gameData.publishers?.join(', '),
                website: gameData.website,
                esrbRating: gameData.esrbRating,
                tags: gameData.tags || [],
                lastUpdated: new Date()
            }
        }).then(([game]) => game);
    }
}

export const gameService = new GameService();