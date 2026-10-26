import Link from "next/link";
import type { Anime } from "@/types/anime";
import AnimeCard from "@/components/AnimeCard";
export default function AnimeSection({ title, subtitle, items, href }: { title: string; subtitle?: string; items: Anime[]; href?: string }) {
  if (!items.length) return null;
  return <section className="content-section"><div className="section-heading"><div><p className="eyebrow">{subtitle || "HANDPICKED FOR YOU"}</p><h2>{title}</h2></div>{href && <Link href={href} className="text-link">View all <span>↗</span></Link>}</div><div className="anime-grid">{items.slice(0, 8).map((anime, i) => <AnimeCard key={anime.id || i} anime={anime}/>)}</div></section>;
}
