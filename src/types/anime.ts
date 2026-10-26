export type Anime = {
  id: string;
  slug: string;
  title: string;
  englishTitle?: string;
  synopsis?: string;
  poster?: string;
  cover?: string;
  banner?: string;
  score?: number | string;
  year?: number | string;
  season?: string;
  status?: string;
  type?: string;
  episodes?: number;
  genres: string[];
  url?: string;
};
export type Episode = {
  id: string;
  number: number;
  title: string;
  thumbnail?: string;
  duration?: number | string;
  airedAt?: string;
  url?: string;
};
export type StreamSource = { name: string; url: string; type?: string; subtitles?: { label: string; url: string; language?: string }[] };
