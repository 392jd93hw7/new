import Link from "next/link";
import { ArrowRight, Play, Sparkles, Layers3, CalendarDays } from "lucide-react";
import { getCatalog } from "@/lib/api";
import AnimeSection from "@/components/AnimeSection";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("Discover Your Next Anime", "Explore trending anime, discover popular series, and find your next watch on AnimeHeaven.", "/");
export const revalidate = 120;
export default async function HomePage() {
  const [trending, popular, latest] = await Promise.all([getCatalog("trending"), getCatalog("popular"), getCatalog("latest")]);
  const hasData = trending.length + popular.length + latest.length > 0;
  return <div className="page-shell">
    <section className="hero"><div className="hero-content"><p className="hero-tag"><Sparkles size={13} style={{display:"inline",verticalAlign:"-2px"}}/> YOUR NEXT OBSESSION STARTS HERE</p><h1>Find your next<br/><em>anime universe.</em></h1><p>Discover unforgettable stories, explore new worlds, and keep every episode within reach. Your anime journey starts here.</p><div className="hero-actions"><Link href="/trending" className="button-primary"><Play size={15} fill="currentColor"/> Explore anime</Link><Link href="/search" className="button-secondary">Find a series <ArrowRight size={15}/></Link></div></div><div className="hero-art" aria-hidden="true"><div className="orb"/><i className="hero-spark"/></div></section>
    <div className="stats-strip"><div className="stat"><div className="stat-icon"><Sparkles size={18}/></div><div><strong>Discover</strong><span>Stories worth staying up for</span></div></div><div className="stat"><div className="stat-icon"><Layers3 size={18}/></div><div><strong>Explore</strong><span>Find a world for every mood</span></div></div><div className="stat"><div className="stat-icon"><CalendarDays size={18}/></div><div><strong>Stay current</strong><span>Keep up with new episodes</span></div></div></div>
    {trending.length ? <AnimeSection title="Trending now" subtitle="WHAT EVERYONE IS WATCHING" items={trending} href="/trending"/> : null}
    {popular.length ? <AnimeSection title="Popular picks" subtitle="FAN FAVORITES" items={popular} href="/popular"/> : null}
    {latest.length ? <AnimeSection title="Recently updated" subtitle="FRESH FROM THE FEED" items={latest} href="/latest"/> : null}
    {!hasData && <section className="content-section"><div className="section-heading"><div><p className="eyebrow">GETTING CONNECTED</p><h2>Your anime world is loading</h2></div></div><div className="empty-note">AnimeHeaven is ready, but the configured API did not return a recognized anime list. Confirm the API is reachable and update the endpoint candidates in <code>src/lib/api.ts</code> to match its documented routes.</div><div style={{marginTop:18}}><Link className="button-secondary" href="/api/health">Check API status <ArrowRight size={15}/></Link></div></section>}
    <section className="content-section"><div className="section-heading"><div><p className="eyebrow">EXPLORE YOUR WAY</p><h2>What are you in the mood for?</h2></div></div><div className="genre-tiles">{["Action","Adventure","Comedy","Drama","Fantasy","Romance"].map((genre,i)=><Link key={genre} href={`/genres/${genre.toLowerCase()}`} className={`genre-tile genre-${i}`}><span>{["⚔","✦","☻","◈","✧","♡"][i]}</span><strong>{genre}</strong><small>Explore titles ↗</small></Link>)}</div></section>
  </div>;
}
