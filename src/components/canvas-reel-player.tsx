"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { AspectRatioOption, VideoPlan } from "@/types/video";
import {
  getDimensionsForAspectRatio,
  loadReferenceImages,
  renderFrameAtTime,
} from "@/lib/video-renderer";

interface CanvasReelPlayerProps {
  plan: VideoPlan;
  aspectRatio: AspectRatioOption;
  durationSec: number;
  referenceFrames: string[];
  showCaptions: boolean;
  autoPlay?: boolean;
  externalTimeSec?: number;
  hideControls?: boolean;
}

export function CanvasReelPlayer({
  plan,
  aspectRatio,
  durationSec,
  referenceFrames,
  showCaptions,
  autoPlay = false,
  externalTimeSec,
  hideControls = false,
}: CanvasReelPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(externalTimeSec ?? durationSec * 0.18);
  const timeRef = useRef(currentTime);

  const { width, height } = getDimensionsForAspectRatio(aspectRatio);

  useEffect(() => {
    let active = true;
    loadReferenceImages(referenceFrames).then((imgs) => {
      if (!active) return;
      imagesRef.current = imgs;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        renderFrameAtTime(
          ctx,
          width,
          height,
          plan,
          timeRef.current,
          durationSec,
          imgs,
          showCaptions
        );
      }
    });
    return () => {
      active = false;
    };
  }, [referenceFrames, plan, width, height, durationSec, showCaptions]);

  useEffect(() => {
    if (externalTimeSec !== undefined) {
      timeRef.current = externalTimeSec;
      setCurrentTime(externalTimeSec);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        renderFrameAtTime(
          ctx,
          width,
          height,
          plan,
          externalTimeSec,
          durationSec,
          imagesRef.current,
          showCaptions
        );
      }
    }
  }, [externalTimeSec, plan, width, height, durationSec, showCaptions]);

  useEffect(() => {
    if (!isPlaying) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        renderFrameAtTime(
          ctx,
          width,
          height,
          plan,
          timeRef.current,
          durationSec,
          imagesRef.current,
          showCaptions
        );
      }
      return;
    }

    let rafId = 0;
    let lastNow = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastNow) / 1000;
      lastNow = now;

      let next = timeRef.current + dt;
      if (next >= durationSec) {
        next = 0;
      }
      timeRef.current = next;
      setCurrentTime(next);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        renderFrameAtTime(
          ctx,
          width,
          height,
          plan,
          next,
          durationSec,
          imagesRef.current,
          showCaptions
        );
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, plan, width, height, durationSec, showCaptions]);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying((prev) => !prev);
  };

  const handleRestart = (e: React.MouseEvent) => {
    e.stopPropagation();
    timeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    timeRef.current = val;
    setCurrentTime(val);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      renderFrameAtTime(
        ctx,
        width,
        height,
        plan,
        val,
        durationSec,
        imagesRef.current,
        showCaptions
      );
    }
  };

  return (
    <div
      className="relative w-full h-full bg-zinc-950 select-none group"
      onMouseEnter={() => {
        if (!autoPlay && externalTimeSec === undefined) {
          setIsPlaying(true);
        }
      }}
      onMouseLeave={() => {
        if (!autoPlay && externalTimeSec === undefined) {
          setIsPlaying(false);
        }
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full object-contain block"
      />

      {!hideControls && (
        <div
          className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex items-center gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? "Pause video" : "Play video"}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-white/15 hover:bg-white/25 text-white transition-colors shrink-0"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            aria-label="Restart video"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-white/15 hover:bg-white/25 text-white transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min={0}
            max={durationSec}
            step={0.05}
            value={currentTime}
            onChange={handleScrub}
            aria-label="Video timeline"
            className="flex-1 accent-rose-600 h-1.5 cursor-pointer"
          />

          <span className="font-mono text-xs text-white/90 tabular-nums whitespace-nowrap shrink-0">
            {currentTime.toFixed(1)}s / {durationSec.toFixed(1)}s
          </span>
        </div>
      )}
    </div>
  );
}
