"use client";

import { useRef, useState } from "react";
import {
  Wand2,
  ImagePlus,
  X,
  Film,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AspectRatioOption,
  ReferenceFrame,
  VideoStyleOption,
} from "@/types/video";

const ASPECT_OPTIONS: { value: AspectRatioOption; label: string }[] = [
  { value: "16:9", label: "16:9 Widescreen" },
  { value: "9:16", label: "9:16 Vertical" },
  { value: "1:1", label: "1:1 Square" },
];

const DURATION_OPTIONS: (4 | 6 | 8 | 12)[] = [4, 6, 8, 12];

const STYLE_OPTIONS: VideoStyleOption[] = [
  "Cinematic Noir",
  "Editorial Motion",
  "Atmospheric Abstract",
  "Kinetic Typography",
  "Minimalist Studio",
];

interface VideoComposerProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  aspectRatio: AspectRatioOption;
  onAspectRatioChange: (val: AspectRatioOption) => void;
  durationSec: 4 | 6 | 8 | 12;
  onDurationChange: (val: 4 | 6 | 8 | 12) => void;
  style: VideoStyleOption;
  onStyleChange: (val: VideoStyleOption) => void;
  showCaptions: boolean;
  onShowCaptionsChange: (val: boolean) => void;
  referenceFrames: ReferenceFrame[];
  onReferenceFramesChange: (frames: ReferenceFrame[]) => void;
  isGenerating: boolean;
  renderStage: string;
  renderProgress: number;
  renderElapsedSec: number;
  errorMessage: string | null;
  liveCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  promptInputRef: React.RefObject<HTMLTextAreaElement | null>;
  onGenerate: () => void;
}

export function VideoComposer({
  prompt,
  onPromptChange,
  aspectRatio,
  onAspectRatioChange,
  durationSec,
  onDurationChange,
  style,
  onStyleChange,
  showCaptions,
  onShowCaptionsChange,
  referenceFrames,
  onReferenceFramesChange,
  isGenerating,
  renderStage,
  renderProgress,
  renderElapsedSec,
  errorMessage,
  liveCanvasRef,
  promptInputRef,
  onGenerate,
}: VideoComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = Math.max(0, 4 - referenceFrames.length);
    const chosen = Array.from(files).slice(0, remainingSlots);

    const loaded = await Promise.all(
      chosen.map(
        (file) =>
          new Promise<ReferenceFrame | null>((resolve) => {
            if (!file.type.startsWith("image/")) {
              resolve(null);
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") {
                resolve({
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  name: file.name,
                  dataUrl: reader.result,
                });
              } else {
                resolve(null);
              }
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          })
      )
    );

    const valid = loaded.filter((item): item is ReferenceFrame => item !== null);
    if (valid.length > 0) {
      onReferenceFramesChange([...referenceFrames, ...valid]);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing || isGenerating) return;
    setIsEnhancing(true);
    setEnhanceError(null);
    try {
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), style }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not refine prompt.");
      }
      if (data.prompt) {
        onPromptChange(data.prompt);
      }
    } catch (err) {
      setEnhanceError(
        err instanceof Error ? err.message : "Could not refine prompt."
      );
    } finally {
      setIsEnhancing(false);
    }
  };

  const displayError = errorMessage || enhanceError;

  return (
    <section
      id="studio-composer"
      className="rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Editorial Headline + Prompt Composer */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
              Direct and render motion videos from any scene idea.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Describe a sequence or upload up to four still frames. KinoFrame
              choreographs camera motion, lighting transitions, and kinetic
              titles, then renders a downloadable WebM video.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="video-prompt-input"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Scene Prompt
                </label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={!prompt.trim() || isEnhancing || isGenerating}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Refining...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Refine Prompt</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                id="video-prompt-input"
                ref={promptInputRef}
                rows={3}
                value={prompt}
                onChange={(e) => {
                  onPromptChange(e.target.value);
                  if (enhanceError) setEnhanceError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    onGenerate();
                  }
                }}
                disabled={isGenerating}
                placeholder="Describe camera movement, lighting, mood, and subjects..."
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-60"
              />
            </div>

            {/* Parameters Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <span className="block text-xs text-muted-foreground">
                  Aspect Ratio
                </span>
                <Select
                  value={aspectRatio}
                  onValueChange={(v) =>
                    onAspectRatioChange(v as AspectRatioOption)
                  }
                  disabled={isGenerating}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs text-muted-foreground">
                  Duration
                </span>
                <Select
                  value={String(durationSec)}
                  onValueChange={(v) =>
                    onDurationChange(Number(v) as 4 | 6 | 8 | 12)
                  }
                  disabled={isGenerating}
                >
                  <SelectTrigger className="h-10 w-full font-mono tabular-nums">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((sec) => (
                      <SelectItem
                        key={sec}
                        value={String(sec)}
                        className="font-mono tabular-nums"
                      >
                        {sec} seconds
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs text-muted-foreground">
                  Direction
                </span>
                <Select
                  value={style}
                  onValueChange={(v) => onStyleChange(v as VideoStyleOption)}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs text-muted-foreground">
                  Title Captions
                </span>
                <button
                  type="button"
                  onClick={() => onShowCaptionsChange(!showCaptions)}
                  disabled={isGenerating}
                  className="h-10 px-3 w-full rounded-md border border-input bg-background text-sm text-foreground text-left hover:bg-muted transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {showCaptions ? "On" : "Off"}
                </button>
              </div>
            </div>

            {/* Reference Frames & Generate CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFilesSelected(e.target.files);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating || referenceFrames.length >= 4}
                  className="h-10 px-4 rounded-lg border border-border bg-background text-xs font-medium text-foreground inline-flex items-center gap-2 hover:bg-muted disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>
                    {referenceFrames.length > 0
                      ? `Frames (${referenceFrames.length}/4)`
                      : "Animate Images"}
                  </span>
                </button>

                {referenceFrames.map((frame) => (
                  <div
                    key={frame.id}
                    className="relative h-10 w-10 rounded-md overflow-hidden border border-border shrink-0 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={frame.dataUrl}
                      alt={frame.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onReferenceFramesChange(
                          referenceFrames.filter((f) => f.id !== frame.id)
                        )
                      }
                      aria-label={`Remove ${frame.name}`}
                      className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={onGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="h-11 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap shrink-0"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Video...</span>
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    <span>Create Video</span>
                  </>
                )}
              </button>
            </div>

            {displayError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{displayError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Render Monitor */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex-1 rounded-xl border border-border bg-zinc-950 overflow-hidden flex flex-col justify-between min-h-[260px]">
            <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium text-zinc-200">Render Monitor</span>
              <span className="font-mono tabular-nums">
                {aspectRatio} · {durationSec}s · 30fps
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 relative">
              <canvas
                ref={liveCanvasRef}
                className={`max-w-full max-h-[280px] rounded-lg bg-black ${
                  isGenerating ? "opacity-100" : "opacity-0 absolute pointer-events-none"
                }`}
              />

              {!isGenerating && (
                <div className="text-center space-y-2 max-w-xs px-4">
                  <div className="mx-auto h-10 w-10 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-300">
                    <Film className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium text-zinc-200">
                    Ready to choreograph
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Frames render live here while your video encodes into a
                    playable WebM file.
                  </p>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="truncate">
                  {isGenerating ? renderStage : "Standby"}
                </span>
                <span className="font-mono tabular-nums text-zinc-400 shrink-0">
                  {isGenerating
                    ? `${renderElapsedSec.toFixed(1)}s / ${durationSec.toFixed(1)}s (${Math.round(
                        renderProgress * 100
                      )}%)`
                    : "00.0s"}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-primary transition-[width] duration-150"
                  style={{
                    width: `${isGenerating ? Math.max(4, renderProgress * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
