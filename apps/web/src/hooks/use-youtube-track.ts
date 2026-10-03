import { useCallback, useEffect, useRef, useState } from "react";

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  destroy: () => void;
}

interface YTEvent {
  target: YTPlayer;
  data?: number;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: string | HTMLElement,
        options: {
          events?: {
            onReady?: (e: YTEvent) => void;
            onStateChange?: (e: YTEvent) => void;
          };
        },
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const IFRAME_ID = "hero-yt-iframe";

/** Drives a hidden YouTube embed as the site's background track. Returns the
 * iframe src to render plus play state and a toggle. */
export function useYoutubeTrack(videoId: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const wantPlay = useRef(false);

  useEffect(() => {
    if (!videoId) return;
    let alive = true;

    const init = () => {
      if (!alive || !window.YT?.Player || !document.getElementById(IFRAME_ID))
        return;
      try {
        playerRef.current?.destroy();
      } catch {}
      playerRef.current = new window.YT.Player(IFRAME_ID, {
        events: {
          onReady: (e) => {
            if (wantPlay.current) {
              e.target.unMute();
              e.target.setVolume(100);
              e.target.playVideo();
            }
          },
          onStateChange: (e) => {
            if (!alive) return;
            // 1 = playing, 2 = paused, 0 = ended, 3 = buffering
            if (e.data === 1) {
              setIsPlaying(true);
              setPending(false);
            } else if (e.data === 3) {
              setPending(true);
            } else if (e.data === 2 || e.data === 0) {
              setIsPlaying(false);
              setPending(false);
            }
          },
        },
      });
    };

    if (window.YT?.Player) init();
    else {
      if (!document.getElementById("yt-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        init();
      };
    }

    return () => {
      alive = false;
      try {
        playerRef.current?.destroy();
      } catch {}
      playerRef.current = null;
    };
  }, [videoId]);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (isPlaying) {
      wantPlay.current = false;
      setIsPlaying(false);
      setPending(false);
      try {
        p?.pauseVideo();
      } catch {}
      return;
    }
    wantPlay.current = true;
    setPending(true);
    try {
      p?.unMute();
      p?.setVolume(100);
      p?.playVideo();
    } catch {}
  }, [isPlaying]);

  const src = videoId
    ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&loop=1&playlist=${videoId}&playsinline=1&controls=0&rel=0&modestbranding=1`
    : "";

  return { iframeId: IFRAME_ID, src, isPlaying, pending, toggle };
}
