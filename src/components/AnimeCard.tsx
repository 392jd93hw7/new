import Link from "next/link";
import type { Anime } from "@/types/anime";
import { animePath } from "@/lib/utils";
export default function AnimeCard({ anime, compact = false }: { anime: Anime; compact?: boolean }) {
  return <article className={`anime-card ${compact ? "anime-card-compact" : ""}`}>
    <Link href={animePath(anime)} className="poster-wrap" aria-label={`View ${anime.title}`}>
      {anime.poster ? <img src={anime.poster} alt={`${anime.title} poster`} loading="lazy"/> : <div className="poster-fallback"><span>AH</span><small>ANIMEHEAVEN</small></div>}
      <span className="poster-shade"/>{anime.type && <span className="type-pill">{anime.type}</span>}
      {anime.score && <span className="score-pill">★ {anime.score}</span>}
      <span className="card-play">▶</span>
    </Link>
    <div className="card-copy"><Link href={animePath(anime)} className="card-title">{anime.title}</Link><div className="card-meta"><span>{anime.year || anime.season || "Anime"}</span><span>{anime.episodes ? `${anime.episodes} eps` : anime.status || "Details"}</span></div></div>
  </article>;
}
