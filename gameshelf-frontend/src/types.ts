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
  }
}