// Enhanced types.ts
export interface Game {
  id: number;
  name: string;
  released: string;
  background_image: string;
  rating: number;
  platforms: string[];
  genres: string[];
  UserGame?: {
    playStatus: 'playing' | 'completed' | 'on-hold' | 'dropped' | 'plan-to-play';
    personalRating: number | null;
    review: string | null;
    createdAt?: string;
    updatedAt?: string;
  }
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  totalGames: number;
  averageRating: number | null;
  completedGames: number;
  currentlyPlaying: number;
}

export interface GameDetails extends Game {
  description_raw: string;
  website?: string;
  developers: string[];
  screenshots?: string[];
  metacritic?: number;
}

export interface Review {
  userId: number;
  username: string;
  rating: number | null;
  review: string;
  updatedAt: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchFilters {
  genres?: string[];
  platforms?: string[];
  minRating?: number;
  maxRating?: number;
  releaseYear?: number;
  playStatus?: string[];
}

export interface GameStats {
  totalReviews: number;
  averageRating: number | null;
  ratingDistribution: { [key: number]: number };
  popularityRank?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class GameShelfError extends Error {
  constructor(
    message: string,
    code?: string,
    status?: number,
    details?: any
  ) {
    super(message);
    this.name = 'GameShelfError';
  }
}