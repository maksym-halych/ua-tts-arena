"use client";

// Adapted from TTS Arena (Apache License 2.0). See NOTICE.

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import WaveSurfer from "wavesurfer.js";

export type WaveformHandle = {
  play: () => void;
  pause: () => void;
};

export function WaveformPlayer({
  ref,
  src,
  labels,
  onReady,
  onPlay,
  onProgress,
  onEnded,
  onError,
}: {
  ref?: Ref<WaveformHandle>;
  src: string;
  labels: { play: string; pause: string };
  onReady?: (durationSeconds: number) => void;
  onPlay?: () => void;
  onProgress?: (currentSeconds: number) => void;
  onEnded?: () => void;
  onError?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // The latest callbacks are kept in a ref, so a new callback doesn't load the audio again.
  const callbacks = useRef({ onReady, onPlay, onProgress, onEnded, onError });
  useEffect(() => {
    callbacks.current = { onReady, onPlay, onProgress, onEnded, onError };
  });

  useImperativeHandle(ref, () => ({
    play: () => {
      wavesurfer.current?.play().catch(() => {
        // The browser can block play before the first click. The rater then uses the button.
      });
    },
    pause: () => wavesurfer.current?.pause(),
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    const styles = getComputedStyle(document.documentElement);
    let destroyed = false;

    const instance = WaveSurfer.create({
      container: containerRef.current,
      height: 40,
      // Must be opaque, because the played part takes its transparency from this color.
      waveColor: styles.getPropertyValue("--color-ink-3").trim() || "#888",
      progressColor: styles.getPropertyValue("--color-accent").trim() || "#36c",
      cursorWidth: 0,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      normalize: true,
      url: src,
    });
    wavesurfer.current = instance;

    instance.on("ready", (duration) => {
      setReady(true);
      callbacks.current.onReady?.(duration);
    });
    instance.on("play", () => {
      setPlaying(true);
      callbacks.current.onPlay?.();
    });
    instance.on("pause", () => setPlaying(false));
    instance.on("finish", () => {
      setPlaying(false);
      setElapsed(0);
      callbacks.current.onEnded?.();
    });
    instance.on("timeupdate", (time) => {
      setElapsed(time);
      callbacks.current.onProgress?.(time);
    });
    instance.on("error", () => {
      if (!destroyed) callbacks.current.onError?.();
    });

    return () => {
      destroyed = true;
      instance.destroy();
      wavesurfer.current = null;
    };
  }, [src]);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => wavesurfer.current?.playPause()}
        disabled={!ready}
        aria-label={playing ? labels.pause : labels.play}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-canvas transition-transform active:scale-95 disabled:opacity-40"
      >
        {playing ? (
          <span className="flex gap-[3px]">
            <span className="block h-3.5 w-[3px] rounded-full bg-current" />
            <span className="block h-3.5 w-[3px] rounded-full bg-current" />
          </span>
        ) : (
          <span className="ml-0.5 block h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-current" />
        )}
      </button>
      <div ref={containerRef} className="h-10 min-w-0 flex-1" />
      <span className="tag w-9 shrink-0 text-right">{elapsed.toFixed(1)}s</span>
    </div>
  );
}
