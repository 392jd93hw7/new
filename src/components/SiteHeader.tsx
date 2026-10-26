import Link from "next/link";
import { Search, Flame, Compass, Clock3, Clapperboard } from "lucide-react";
export default function SiteHeader() {
  return <header className="site-header"><div className="header-inner">
    <Link className="brand" href="/" aria-label="AnimeHeaven home"><span className="brand-mark">A<span>H</span></span><span>anime<span className="brand-light">heaven</span></span></Link>
    <nav className="main-nav" aria-label="Main navigation"><Link href="/trending"><Flame size={16}/> Trending</Link><Link href="/popular"><Compass size={16}/> Discover</Link><Link href="/latest"><Clock3 size={16}/> Latest</Link><Link href="/movies"><Clapperboard size={16}/> Movies</Link></nav>
    <form action="/search" className="header-search"><Search size={17}/><input name="q" placeholder="Search anime..." aria-label="Search anime"/><kbd>↵</kbd></form>
  </div></header>;
}
