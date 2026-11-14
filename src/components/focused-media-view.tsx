"use client";

import { useState, useEffect } from "react";
import { X, Download, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { CanvasReelPlayer } from "@/components/canvas-reel-player";
import type { GeneratedReel } from "@/types/video";

interface FocusedMediaViewProps {
  isOpen: boolean;
  onClose: () => void;
  reels: GeneratedReel[];
  initialIndex: number;
  onEditScenes: (reel: GeneratedReel) => void;
  onExportVideo: (reel: GeneratedReel) => Promise<void>;
}

export function FocusedMediaView({
  isOpen,
  onClose,
  reels,
  initialIndex,
  onEditScenes,
  onExportVideo,
}: FocusedMediaViewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      if (e.key === "ArrowRight")
        setCurrentIndex((prev) => Math.min(reels.length - 1, prev + 1));
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, reels.length]);

  if (!isOpen || reels.length === 0) return null;
  const currentReel = reels[currentIndex] || reels[0];

  const handleDownload = async () => {
    if (currentReel.videoUrl) {
      const link = document.createElement("a");
      link.href = currentReel.videoUrl;
      link.download = `${
        currentReel.plan.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
        "kinoframe-reel"
      }.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      await onExportVideo(currentReel);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={currentReel.plan.title}
    >
      {/* Top Bar */}
      <div className="h-14 px-4 sm:px-6 border-b border-border flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono tabular-nums min-w-0">
          <span className="font-sans text-sm font-semibold text-foreground truncate">
            {currentReel.plan.title}
          </span>
          <span aria-hidden="true">·</span>
          <span>{currentReel.aspectRatio}</span>
          <span aria-hidden="true">·</span>
          <span>{currentReel.durationSec}s</span>
          <span aria-hidden="true">·</span>
          <span>
            {currentIndex + 1} / {reels.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close theater view"
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Theater Split */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8 bg-zinc-950 flex items-center justify-center p-4 sm:p-8 min-h-0">
          <div className="w-full h-full max-w-4xl flex items-center justify-center">
            {currentReel.videoUrl ? (
              <video
                key={currentReel.id + currentReel.videoUrl}
                src={currentReel.videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="max-w-full max-h-full rounded-xl object-contain"
              />
            ) : (
              <div
                className={`w-full max-h-full rounded-xl overflow-hidden ${
                  currentReel.aspectRatio === "9:16"
                    ? "aspect-[9/16] max-w-sm"
                    : currentReel.aspectRatio === "1:1"
                    ? "aspect-square max-w-lg"
                    : "aspect-video"
                }`}
              >
                <CanvasReelPlayer
                  key={currentReel.id}
                  plan={currentReel.plan}
                  aspectRatio={currentReel.aspectRatio}
                  durationSec={currentReel.durationSec}
                  referenceFrames={currentReel.referenceFrames}
                  showCaptions={currentReel.showCaptions}
                  autoPlay
                />
              </div>
            )}
          </div>
        </div>

        {/* Metadata Sidebar */}
        <aside className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-border bg-card p-6 flex flex-col justify-between gap-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <div className="text-xs text-muted-foreground mb-1.5">
                Director Prompt
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {currentReel.prompt}
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground">
                Choreographed Scenes
              </div>
              <div className="divide-y divide-border">
                {currentReel.plan.scenes.map((scene, idx) => (
                  <div key={scene.id} className="py-2.5 space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        0{idx + 1}. {scene.headline}
                      </span>
                      <span className="font-mono text-muted-foreground tabular-nums">
                        {scene.durationSec}s
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {scene.subtitle} · {scene.cameraMotion} · {scene.visualMotif}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>{currentReel.videoUrl ? "Download .webm" : "Export .webm"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditScenes(currentReel);
                }}
                className="h-10 px-4 rounded-lg border border-border bg-background text-foreground text-xs font-medium inline-flex items-center justify-center gap-2 hover:bg-muted transition-colors whitespace-nowrap"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Edit Scenes</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                disabled={currentIndex === 0}
                className="flex-1 h-9 px-3 rounded-lg border border-border text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((p) => Math.min(reels.length - 1, p + 1))
                }
                disabled={currentIndex === reels.length - 1}
                className="flex-1 h-9 px-3 rounded-lg border border-border text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}