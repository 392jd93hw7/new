import type { Anime } from "@/types/anime";
export function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "anime";
}
export function animePath(anime: Pick<Anime, "id" | "slug" | "title">) {
  const slug = anime.slug || slugify(anime.title);
  return `/anime/${slug}-${encodeURIComponent(anime.id)}`;
}
export function imageOrFallback(value?: string) {
  return value && /^https?:\/\//i.test(value) ? value : "";
}
export function textValue(value: unknown, fallback = ""): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}
