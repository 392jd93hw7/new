import { searchAnime } from "@/lib/api";
import AnimeCard from "@/components/AnimeCard";
import SearchForm from "@/components/SearchForm";
import { pageMetadata } from "@/lib/seo";
type Props = { searchParams: Promise<{ q?: string }> };
export async function generateMetadata({searchParams}: Props) { const q=(await searchParams).q || ""; return pageMetadata(q ? `Search results for ${q}` : "Search anime", "Search anime by title and explore matching series on AnimeHeaven.", `/search${q ? `?q=${encodeURIComponent(q)}` : ""}`); }
export default async function SearchPage({searchParams}: Props) {
 const q=((await searchParams).q || "").trim(); const items=q ? await searchAnime(q) : [];
 return <div className="page-shell simple-page"><p className="eyebrow">FIND YOUR NEXT FAVORITE</p><h1>Search anime</h1><p className="page-intro">Search by title and discover a series that fits your mood.</p><SearchForm initial={q}/>{q && <><div className="section-heading"><div><p className="eyebrow">RESULTS FOR</p><h2>“{q}”</h2></div><span className="text-link">{items.length} results</span></div>{items.length ? <div className="anime-grid">{items.map(a=><AnimeCard key={a.id} anime={a}/>)}</div> : <div className="empty-note">No results were returned. The API may use a different search endpoint; update the candidates in <code>src/lib/api.ts</code> if needed.</div>}</>}</div>;
}
