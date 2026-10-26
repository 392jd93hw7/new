"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

type Props = { src: string; poster?: string; title: string };

export default function VideoPlayer({ src, poster, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    let hls: Hls | undefined;
    setError("");

    if (/\.m3u8(?:\?|$)/i.test(src)) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      } else if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) setError("Unable to play this HLS stream. The source may be unavailable or require a permitted proxy.");
        });
      } else {
        setError("This browser does not support HLS playback.");
      }
    } else {
      video.src = src;
    }

    return () => {
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  return (
    <div className="video-player-shell">
      <video ref={videoRef} controls playsInline preload="metadata" poster={poster} aria-label={title} style={{width:"100%",height:"100%",objectFit:"contain",background:"#000"}} />
      {error && <p className="player-error" role="status">{error}</p>}
    </div>
  );
}
