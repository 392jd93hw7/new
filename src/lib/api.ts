import type { Anime, Episode, StreamSource } from "@/types/anime";
import { slugify, textValue } from "@/lib/utils";

const BASE = (process.env.ANIME_API_BASE_URL || "http://3.26.204.226:3000").replace(/\/$/, "");
const TIMEOUT = Number(process.env.ANIME_API_TIMEOUT_MS || 7000);

async function request(path: string): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(`${BASE}${path.startsWith("/") ? path : `/${path}`}`, {
      signal: controller.signal, headers: { accept: "application/json" },
      next: { revalidate: 120 }
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") || "";
    if (!type.includes("json")) return null;
    return await response.json();
  } catch { return null; } finally { clearTimeout(timer); }
}
function records(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of ["results", "data", "anime", "items", "list", "trending", "popular", "recent", "episodes"]) {
    const nested = obj[key];
    if (Array.isArray(nested)) return nested.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
    if (nested && typeof nested === "object") {
      const deep = records(nested);
      if (deep.length) return deep;
    }
  }
  return [];
}
function first(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
  return undefined;
}
function list(value: unknown): string[] {
  if (!Array.isArray(value)) return typeof value === "string" ? value.split(/[,|]/).map(s => s.trim()).filter(Boolean) : [];
  return value.map(v => typeof v === "string" ? v : textValue((v as Record<string, unknown>)?.name)).filter(Boolean);
}
export function normalizeAnime(raw: Record<string, unknown>, index = 0): Anime {
  const title = textValue(first(raw, ["title", "name", "animeTitle", "englishTitle", "romaji"]), "Untitled anime");
  const id = textValue(first(raw, ["id", "mal_id", "animeId", "slug", "url"]), `${slugify(title)}-${index}`);
  const poster = textValue(first(raw, ["poster", "image", "image_url", "coverImage", "thumbnail", "posterImage", "img", "cover"]), "");
  const cover = textValue(first(raw, ["cover", "banner", "bannerImage", "coverImage", "background"]), poster);
  return {
    id, slug: slugify(title), title,
    englishTitle: textValue(first(raw, ["englishTitle", "english_title", "title_english"]), ""),
    synopsis: textValue(first(raw, ["synopsis", "description", "overview", "plot"]), ""),
    poster, cover,
    banner: textValue(first(raw, ["banner", "bannerImage", "coverImage"]), cover),
    score: first(raw, ["score", "rating", "mean"]) as number | string | undefined,
    year: first(raw, ["year", "seasonYear", "aired"]) as number | string | undefined,
    season: textValue(first(raw, ["season"]), ""),
    status: textValue(first(raw, ["status", "airingStatus"]), ""),
    type: textValue(first(raw, ["type", "format"]), ""),
    episodes: Number(first(raw, ["episodes", "episodeCount", "totalEpisodes"])) || undefined,
    genres: list(first(raw, ["genres", "genre"])),
    url: textValue(first(raw, ["url", "animeUrl", "link"]), "")
  };
}
export function normalizeEpisode(raw: Record<string, unknown>, index = 0): Episode {
  const number = Number(first(raw, ["number", "episodeNumber", "episode", "ep", "episode_no"])) || index + 1;
  return {
    id: textValue(first(raw, ["id", "episodeId", "slug", "url"]), String(number)),
    number,
    title: textValue(first(raw, ["title", "name", "episodeTitle", "episode_title"]), `Episode ${number}`),
    thumbnail: textValue(first(raw, ["thumbnail", "image", "image_url", "still", "episodeImage", "img"]), "") || undefined,
    duration: first(raw, ["duration", "length"]) as string | number | undefined,
    airedAt: textValue(first(raw, ["airedAt", "aired", "date"]), "") || undefined,
    url: textValue(first(raw, ["url", "link", "watchUrl"]), "") || undefined
  };
}
async function firstRecords(paths: string[]): Promise<Record<string, unknown>[]> {
  for (const path of paths) {
    const result = await request(path);
    const items = records(result);
    if (items.length) return items;
  }
  return [];
}
export async function getCatalog(kind: "trending" | "popular" | "latest" | "movies" | "all" = "all"): Promise<Anime[]> {
  const paths: Record<typeof kind, string[]> = {
    trending: ["/api/anime/trending", "/anime/trending", "/trending", "/api/trending"],
    popular: ["/api/anime/popular", "/anime/popular", "/popular", "/api/popular", "/anime"],
    latest: ["/api/episodes/recent", "/episodes/recent", "/recent-episodes", "/latest", "/recent"],
    movies: ["/api/anime/movies", "/anime/movies", "/movies"],
    all: ["/api/anime", "/anime", "/api/catalog", "/catalog", "/popular", "/trending"]
  };
  const items = await firstRecords(paths[kind]);
  return items.map(normalizeAnime).filter(a => a.title !== "Untitled anime");
}
export async function searchAnime(query: string): Promise<Anime[]> {
  const q = encodeURIComponent(query);
  const paths = [`/api/search?q=${q}`, `/search?q=${q}`, `/api/anime/search?query=${q}`, `/anime?search=${q}`, `/anime?q=${q}`];
  const items = await firstRecords(paths);
  return items.map(normalizeAnime).filter(a => a.title !== "Untitled anime");
}
export async function getAnime(idOrSlug: string): Promise<Anime | null> {
  const decoded = decodeURIComponent(idOrSlug);
  const id = decoded.match(/-(\d+)$/)?.[1] || decoded;
  const paths = [`/api/anime/${encodeURIComponent(id)}`, `/anime/${encodeURIComponent(id)}`, `/api/anime/details/${encodeURIComponent(id)}`, `/anime/details/${encodeURIComponent(id)}`];
  for (const path of paths) {
    const result = await request(path);
    if (result && typeof result === "object") {
      const nested = (result as Record<string, unknown>).data ?? result;
      if (nested && typeof nested === "object" && !Array.isArray(nested)) return normalizeAnime(nested as Record<string, unknown>);
    }
  }
  const catalog = await getCatalog("all");
  return catalog.find(a => a.id === id || a.slug === decoded || `${a.slug}-${a.id}` === decoded) || null;
}
export async function getEpisodes(idOrSlug: string): Promise<Episode[]> {
  const decoded = decodeURIComponent(idOrSlug);
  const id = decoded.match(/-(\d+)$/)?.[1] || decoded;
  const paths = [`/api/anime/${encodeURIComponent(id)}/episodes`, `/anime/${encodeURIComponent(id)}/episodes`, `/api/episodes/${encodeURIComponent(id)}`, `/episodes/${encodeURIComponent(id)}`];
  for (const path of paths) {
    const items = records(await request(path));
    if (items.length) return items.map(normalizeEpisode);
  }
  return [];
}
export async function getStream(idOrSlug: string, episode: string): Promise<{ sources: StreamSource[]; provider: string }> {
  const id = encodeURIComponent(decodeURIComponent(idOrSlug).match(/-(\d+)$/)?.[1] || idOrSlug);
  const ep = encodeURIComponent(episode);
  const paths = [
    { provider: "AnimeHeaven", path: `/api/animeheaven/stream?animeId=${id}&episode=${ep}` },
    { provider: "AnimeHeaven", path: `/api/stream?animeId=${id}&episode=${ep}&provider=animeheaven` },
    { provider: "AnimeHeaven", path: `/stream?animeId=${id}&episode=${ep}&provider=animeheaven` },
    { provider: "Anikoto", path: `/api/anikoto/stream?animeId=${id}&episode=${ep}` },
    { provider: "Anikoto", path: `/api/stream?animeId=${id}&episode=${ep}&provider=anikoto` }
  ];
  for (const item of paths) {
    const data = await request(item.path);
    const obj = data && typeof data === "object" ? data as Record<string, unknown> : {};
    const raw = records(data);
    const urls = raw.map(v => ({ name: textValue(first(v, ["name", "server", "label"]), item.provider), url: textValue(first(v, ["url", "src", "file", "embed"]), ""), type: textValue(first(v, ["type"]), "embed") })).filter(v => /^https?:\/\//i.test(v.url));
    const direct = textValue(first(obj, ["url", "src", "file", "embed", "streamUrl"]), "");
    if (direct && /^https?:\/\//i.test(direct)) urls.unshift({ name: item.provider, url: direct, type: textValue(obj.type, "embed") });
    if (urls.length) return { sources: urls, provider: item.provider };
  }
  return { sources: [], provider: "unavailable" };
}
export async function apiHealth() {
  const result = await request("/");
  return { configuredBaseUrl: BASE, reachable: result !== null, hasJsonRoot: result !== null, checkedAt: new Date().toISOString() };
}
