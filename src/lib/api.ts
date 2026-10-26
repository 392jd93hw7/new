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
  const decoded = decodeURIComponent(idOrSlug).trim();
  // Route slugs may be either "bleach-269" or a generated fallback such as
  // "bleach-bleach-0" when the upstream search item has no recognized ID field.
  const numericMatch = decoded.match(/-(\\d+)$/);
  const id = numericMatch?.[1] || decoded;
  let titleQuery = numericMatch
    ? decoded.slice(0, numericMatch.index).replace(/-/g, " ")
    : decoded.replace(/-\\d+$/, "").replace(/-/g, " ");

  // Collapse repeated title fragments caused by generated slugs like
  // "bleach-bleach-0" and discard a trailing numeric list index.
  titleQuery = titleQuery.replace(/\\s+\\d+$/, "").trim();
  const words = titleQuery.split(/\\s+/).filter(Boolean);
  if (words.length > 1 && words.slice(0, Math.floor(words.length / 2)).join(" ") === words.slice(Math.floor(words.length / 2)).join(" ")) {
    titleQuery = words.slice(0, Math.floor(words.length / 2)).join(" ");
  }

  if (numericMatch) {
    for (const path of [
      `/api/anime?malId=${encodeURIComponent(id)}`,
      `/api/anime?mal_id=${encodeURIComponent(id)}`,
    ]) {
      const result = await request(path);
      if (!result || typeof result !== "object") continue;
      const obj = result as Record<string, unknown>;
      const nested = obj.data ?? obj.anime ?? result;
      if (!nested || typeof nested !== "object" || Array.isArray(nested)) continue;
      const raw = nested as Record<string, unknown>;
      if (first(raw, ["title", "name", "animeTitle", "englishTitle", "romaji"])) return normalizeAnime(raw);
    }
  }

  // Search is the known-working endpoint; use title matching when a route ID
  // is absent or the detail endpoint does not return a usable record.
  for (const query of [...new Set([titleQuery, titleQuery.split(" ").slice(0, Math.ceil(titleQuery.split(" ").length / 2)).join(" ")])]) {
    if (!query) continue;
    const results = await searchAnime(query);
    const found = results.find((anime) =>
      (numericMatch && anime.id === id) ||
      anime.slug === decoded ||
      `${anime.slug}-${anime.id}` === decoded ||
      anime.title.toLowerCase() === query.toLowerCase() ||
      anime.slug === slugify(query)
    );
    if (found) return found;
  }
  return null;
}
export async function getEpisodes(idOrSlug: string): Promise<Episode[]> {
  const decoded = decodeURIComponent(idOrSlug).trim();
  const id = decoded.match(/-(\d+)$/)?.[1] || decoded;
  const paths = [
    `/api/episode?malId=${encodeURIComponent(id)}`,
    `/api/episodes?malId=${encodeURIComponent(id)}&source=animeheaven`,
    `/api/episodes?malId=${encodeURIComponent(id)}`,
    `/api/episodes?mal_id=${encodeURIComponent(id)}`,
    `/api/anime?malId=${encodeURIComponent(id)}`,
    `/api/anime/${encodeURIComponent(id)}/episodes`,
    `/api/episodes/${encodeURIComponent(id)}`,
  ];
  for (const path of paths) {
    const result = await request(path);
    const items = records(result);
    if (items.length) return items.map(normalizeEpisode);

    // Some detail APIs include episode records inside the anime object.
    if (result && typeof result === "object") {
      const obj = result as Record<string, unknown>;
      const nested = obj.data ?? obj.anime ?? result;
      if (nested && typeof nested === "object" && !Array.isArray(nested)) {
        const episodes = records((nested as Record<string, unknown>).episodes);
        if (episodes.length) return episodes.map(normalizeEpisode);
      }
    }
  }
  return [];
}
export async function getStream(
  idOrSlug: string,
  episode: string,
  type: "sub" | "dub" | "raw" = "sub",
  preferredServer?: string
): Promise<{ sources: StreamSource[]; provider: string }> {
  const decoded = decodeURIComponent(idOrSlug).trim();
  const numericId = decoded.match(/-(\\d+)$/)?.[1];
  const id = numericId ? `mal-${numericId}` : decoded;
  const ep = encodeURIComponent(episode);
  const server = preferredServer ? `?server=${encodeURIComponent(preferredServer)}` : "";
  const paths = [
    { provider: "AnimeHeaven", path: `/api/watch/animeheaven/${encodeURIComponent(id)}/${ep}/${type}${server}` },
    { provider: "Anikoto", path: `/api/watch/anikoto/${encodeURIComponent(id)}/${ep}/${type}${server}` },
  ];

  const isPlayableMedia = (url: string, keyOrType: string) => {
    if (!/^https?:\\/\\//i.test(url) || /embed|iframe/i.test(keyOrType + " " + url)) return false;
    // Never treat an ordinary webpage as a video. Accept HLS playlists and
    // direct media files only; many providers return an embed page alongside them.
    return /\\.m3u8(?:[?#]|$)|\\.(?:mp4|m4v|webm|mov)(?:[?#]|$)/i.test(url)
      || /hlsproxyurl|m3u8|hlsurl/i.test(keyOrType);
  };

  for (const item of paths) {
    const data = await request(item.path);
    if (!data || typeof data !== "object") continue;
    const obj = data as Record<string, unknown>;
    const raw = records(data);
    const urls = raw.flatMap((v) => {
      const candidates = [
        ["hlsProxyUrl", v.hlsProxyUrl],
        ["m3u8", v.m3u8],
        ["hlsUrl", v.hlsUrl],
        ["url", v.url],
        ["src", v.src],
        ["file", v.file],
        ["streamUrl", v.streamUrl],
      ] as const;
      return candidates.flatMap(([key, value]) => {
        const url = textValue(value, "");
        if (!url || !isPlayableMedia(url, key + " " + textValue(first(v, ["type", "playbackMode"]), ""))) return [];
        return [{
          name: textValue(first(v, ["name", "server", "label"]), item.provider),
          url,
          type: /m3u8|hls/i.test(key) || /\\.m3u8(?:[?#]|$)/i.test(url) ? "hls" : "direct",
        }];
      });
    });

    for (const key of ["hlsProxyUrl", "m3u8", "hlsUrl", "streamUrl", "file", "url", "src"]) {
      const url = textValue(obj[key], "");
      if (url && isPlayableMedia(url, key) && !urls.some((source) => source.url === url)) {
        urls.unshift({
          name: textValue(obj.server, item.provider),
          url,
          type: /m3u8|hls/i.test(key) || /\\.m3u8(?:[?#]|$)/i.test(url) ? "hls" : "direct",
        });
      }
    }
    if (urls.length) return { sources: urls, provider: textValue(obj.source, item.provider) };
  }
  return { sources: [], provider: "unavailable" };
}
export async function apiHealth() {
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(BASE, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: { accept: "application/json, text/html;q=0.9, */*;q=0.8" },
    });
    const contentType = response.headers.get("content-type") ?? "";

    return {
      configuredBaseUrl: BASE,
      reachable: response.ok,
      hasJsonRoot:
        response.ok && contentType.toLowerCase().includes("application/json"),
      status: response.status,
      checkedAt,
    };
  } catch (error) {
    return {
      configuredBaseUrl: BASE,
      reachable: false,
      hasJsonRoot: false,
      error: error instanceof Error ? error.message : "Unknown API error",
      checkedAt,
    };
  }
}
