import type { Metadata } from "next";
import Link from "next/link";
import { getAnime, getEpisodes, searchAnime } from "@/lib/api";

export const metadata: Metadata = {
  title: "Scratch Test — Anime Metadata & Player",
  description: "A development scratch page to test anime metadata, episode listings, and watch links.",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ q?: string; anime?: string; episode?: string }>;
};

export default async function ScratchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q || "Bleach").trim().slice(0, 100);
  const results = query ? await searchAnime(query) : [];
  const selectedId = params.anime || results[0]?.id;
  const selected = selectedId ? await getAnime(selectedId) : null;
  const episodes = selected ? await getEpisodes(selected.id) : [];
  const episodeNumber = Math.max(1, Number(params.episode) || episodes[0]?.number || 1);
  const watchHref = selected
    ? `/watch/${selected.slug}-${encodeURIComponent(selected.id)}/${episodeNumber}`
    : "#metadata";

  return (
    <div className="page-shell simple-page">
      <p className="eyebrow">DEVELOPMENT TOOL · NO INDEX</p>
      <h1>Anime Scratch Pad</h1>
      <p className="page-intro">
        Test the API response, inspect anime metadata, check episode data, and open the watch page without changing the main site.
      </p>

      <form action="/scratch" method="get" className="big-search">
        <input name="q" defaultValue={query} placeholder="Search anime, e.g. Bleach" aria-label="Search anime" />
        <button type="submit">Search API</button>
      </form>

      <section className="content-section">
        <div className="section-heading">
          <div><p className="eyebrow">UPSTREAM SEARCH RESULTS</p><h2>Matches</h2></div>
          <span className="text-link">{results.length} result{results.length === 1 ? "" : "s"}</span>
        </div>
        {results.length ? (
          <div className="anime-grid">
            {results.map((anime) => (
              <Link key={anime.id} href={`/scratch?q=${encodeURIComponent(query)}&anime=${encodeURIComponent(anime.id)}`} className="anime-card">
                <div className="poster-wrap">
                  {anime.poster ? <img src={anime.poster} alt={`${anime.title} poster`} loading="lazy" /> : <div className="poster-fallback">AH</div>}
                  <span className="type-pill">{anime.type || "ANIME"}</span>
                  <span className="card-play" aria-hidden="true">↗</span>
                </div>
                <div className="card-copy">
                  <span className="card-title">{anime.title}</span>
                  <div className="card-meta"><span>{anime.year || anime.status || "Year N/A"}</span><span>{anime.score ? `★ ${anime.score}` : `ID ${anime.id}`}</span></div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-note">No matches returned. Check that the API is reachable and that the search endpoint returns JSON.</div>
        )}
      </section>

      <section className="content-section" id="metadata">
        <div className="section-heading">
          <div><p className="eyebrow">NORMALIZED API RESPONSE</p><h2>Selected anime metadata</h2></div>
          {selected && <span className="text-link">ID: {selected.id}</span>}
        </div>
        {selected ? (
          <>
            <div className="detail-hero">
              <div>
                {selected.poster ? <img className="detail-poster" src={selected.poster} alt={`${selected.title} poster`} /> : <div className="detail-poster poster-fallback">AH</div>}
              </div>
              <div className="detail-copy">
                <p className="eyebrow">METADATA PREVIEW</p>
                <h2>{selected.title}</h2>
                {selected.englishTitle && selected.englishTitle !== selected.title && <p>{selected.englishTitle}</p>}
                <div className="tag-list">
                  {[selected.type, selected.year, selected.season, selected.status, selected.score ? `★ ${selected.score}` : null, selected.episodes ? `${selected.episodes} episodes` : null]
                    .filter(Boolean).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                </div>
                {selected.genres.length > 0 && <div className="tag-list">{selected.genres.map((genre) => <span className="tag" key={genre}>{genre}</span>)}</div>}
                <p>{selected.synopsis || "Synopsis not provided by the current API response."}</p>
                <div className="hero-actions">
                  <Link className="button-primary" href={watchHref}>▶ Play episode {episodeNumber}</Link>
                  <Link className="button-secondary" href={`/anime/${selected.slug}-${encodeURIComponent(selected.id)}`}>Open anime page ↗</Link>
                </div>
              </div>
            </div>
            <div className="notice">
              <strong>Debug:</strong> selected ID = <code>{selected.id}</code> · slug = <code>{selected.slug}</code> · poster = {selected.poster ? "present" : "missing"} · synopsis = {selected.synopsis ? "present" : "missing"} · genres = {selected.genres.length}
            </div>

            <div className="section-heading">
              <div><p className="eyebrow">EPISODE ENDPOINT</p><h2>Episodes</h2></div>
              <span className="text-link">{episodes.length} returned</span>
            </div>
            {episodes.length ? (
              <div className="episode-grid">
                {episodes.map((episode) => (
                  <div className="episode-card" key={episode.id}>
                    <div className="episode-thumb">
                      {episode.thumbnail ? <img src={episode.thumbnail} alt={episode.title} loading="lazy" /> : <div className="poster-fallback" style={{fontSize: 28}}>EP {episode.number}</div>}
                      <span>EP {episode.number}</span>
                    </div>
                    <div className="episode-info">
                      <strong>{episode.title}</strong>
                      <small>{episode.duration ? String(episode.duration) : "Duration N/A"}{episode.airedAt ? ` · ${episode.airedAt}` : ""}</small>
                      <div style={{marginTop: 9}}>
                        <Link className="button-secondary" href={`/watch/${selected.slug}-${encodeURIComponent(selected.id)}/${episode.number}`}>▶ Play</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-note">The anime metadata was found, but the API returned no episode records for this ID. The Play button opens episode 1 so you can test the stream route anyway.</div>
            )}
          </>
        ) : (
          <div className="empty-note">No anime could be selected. Search for a title above to inspect its metadata.</div>
        )}
      </section>
    </div>
  );
}
