"use client";

import { useState } from "react";
import { Download, Expand, SlidersHorizontal, Copy, Loader2 } from "lucide-react";
import { CanvasReelPlayer } from "@/components/canvas-reel-player";
import type { GeneratedReel } from "@/types/video";

interface ReelCardProps {
  reel: GeneratedReel;
  onExpand: (reel: GeneratedReel) => void;
  onEditScenes: (reel: GeneratedReel) => void;
  onDuplicatePrompt: (reel: GeneratedReel) => void;
  onExportVideo: (reel: GeneratedReel) => Promise<void>;
}

export function ReelCard({
  reel,
  onExpand,
  onEditScenes,
  onDuplicatePrompt,
  onExportVideo,
}: ReelCardProps) {
  const [isExporting, setIsExporting] = useState(false);

  const aspectClass =
    reel.aspectRatio === "9:16"
      ? "aspect-[9/16] max-h-[460px] mx-auto"
      : reel.aspectRatio === "1:1"
      ? "aspect-square max-h-[400px] mx-auto"
      : "aspect-video";

  const handleDownload = async () => {
    if (reel.videoUrl) {
      const a = document.createElement("a");
      a.href = reel.videoUrl;
      a.download = `${reel.plan.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "kinoframe-reel"}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    setIsExporting(true);
    try {
      await onExportVideo(reel);
    } finally {
      setIsExporting(false);
    }
  };

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(reel.createdAt));

  return (
    <article className="rounded-2xl border border-border bg-card overflow-hidden transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Video Surface */}
        <div
          className="lg:col-span-7 bg-zinc-950 flex items-center justify-center p-4 sm:p-6 cursor-pointer"
          onClick={() => onExpand(reel)}
        >
          <div className={`w-full rounded-xl overflow-hidden bg-black ${aspectClass}`}>
            {reel.videoUrl ? (
              <video
                src={reel.videoUrl}
                poster={reel.posterUrl || undefined}
                controls
                loop
                playsInline
                muted
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                  e.currentTarget.play().catch(() => {});
                }}
                className="w-full h-full object-contain"
              />
            ) : (
              <CanvasReelPlayer
                plan={reel.plan}
                aspectRatio={reel.aspectRatio}
                durationSec={reel.durationSec}
                referenceFrames={reel.referenceFrames}
                showCaptions={reel.showCaptions}
              />
            )}
          </div>
        </div>

        {/* Director Metadata & Actions */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between gap-6 border-t lg:border-t-0 lg:border-l border-border">
          <div className="space-y-4">
            {/* Zero-pill unboxed metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono tabular-nums">
              <span>{reel.aspectRatio}</span>
              <span aria-hidden="true">·</span>
              <span>{reel.durationSec}s</span>
              <span aria-hidden="true">·</span>
              <span>{reel.plan.scenes.length} scenes</span>
              <span aria-hidden="true">·</span>
              <span>{reel.style}</span>
            </div>

            <div>
              <h3 className="font-display text-xl font-semibold text-foreground leading-snug">
                {reel.plan.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {reel.prompt}
              </p>
            </div>

            {/* Scene breakdown list (clean hairline rows, zero nested cards) */}
            <div className="pt-2 divide-y divide-border border-t border-border">
              {reel.plan.scenes.map((scene, idx) => (
                <div
                  key={scene.id}
                  className="py-2 flex items-baseline justify-between gap-4 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-muted-foreground mr-2 tabular-nums">
                      0{idx + 1}
                    </span>
                    <span className="font-medium text-foreground">
                      {scene.headline}
                    </span>
                  </div>
                  <span className="font-mono text-muted-foreground tabular-nums shrink-0">
                    {scene.durationSec}s
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {reel.videoUrl ? "Ready to download (.webm)" : "Live canvas preview"}
              </span>
              <span className="font-mono tabular-nums">{formattedTime}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isExporting}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity whitespace-nowrap shrink-0"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Encoding...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{reel.videoUrl ? "Download .webm" : "Export .webm"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onEditScenes(reel)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-medium inline-flex items-center gap-1.5 hover:bg-muted transition-colors whitespace-nowrap shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Edit Scenes</span>
              </button>

              <button
                type="button"
                onClick={() => onDuplicatePrompt(reel)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-medium inline-flex items-center gap-1.5 hover:bg-muted transition-colors whitespace-nowrap shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Reuse Prompt</span>
              </button>

              <button
                type="button"
                onClick={() => onExpand(reel)}
                aria-label="Open theater view"
                className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-medium inline-flex items-center gap-1.5 hover:bg-muted transition-colors whitespace-nowrap shrink-0"
              >
                <Expand className="w-3.5 h-3.5" />
                <span>Theater</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
