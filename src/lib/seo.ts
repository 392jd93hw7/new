import type { Metadata } from "next";
const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export function canonical(path: string) { return `${site}${path.startsWith("/") ? path : `/${path}`}`; }
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: canonical(path) }, openGraph: { title, description, url: canonical(path), siteName: "AnimeHeaven", type: "website" }, twitter: { card: "summary_large_image", title, description } };
}
export function animeJsonLd(anime: { title: string; synopsis?: string; poster?: string; url: string; genres?: string[] }) {
  return { "@context": "https://schema.org", "@type": "TVSeries", name: anime.title, description: anime.synopsis || undefined, image: anime.poster || undefined, genre: anime.genres?.length ? anime.genres : undefined, url: canonical(anime.url) };
}
