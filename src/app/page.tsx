"use client";

import { useRef, useState } from "react";
import { StudioHeader } from "@/components/studio-header";
import { VideoComposer } from "@/components/video-composer";
import { ReelCard } from "@/components/reel-card";
import { SceneEditorModal } from "@/components/scene-editor-modal";
import { FocusedMediaView } from "@/components/focused-media-view";
import { INITIAL_STARTER_REELS, PROMPT_STARTERS } from "@/lib/starter-reels";
import { exportPlanToWebM } from "@/lib/video-renderer";
import type {
  AspectRatioOption,
  GeneratedReel,
  ReferenceFrame,
  VideoPlan,
  VideoStyleOption,
} from "@/types/video";
import { ArrowUpRight } from "lucide-react";

type LibraryFilter = "all" | "exported" | "drafts";

export default function Home() {
  const [reels, setReels] = useState<GeneratedReel[]>(INITIAL_STARTER_REELS);
  const [filter, setFilter] = useState<LibraryFilter>("all");

  // Composer state
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>("16:9");
  const [durationSec, setDurationSec] = useState<4 | 6 | 8 | 12>(6);
  const [style, setStyle] = useState<VideoStyleOption>("Cinematic Noir");
  const [showCaptions, setShowCaptions] = useState(true);
  const [referenceFrames, setReferenceFrames] = useState<ReferenceFrame[]>([]);

  // Live render state
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderStage, setRenderStage] = useState("Standby");
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderElapsedSec, setRenderElapsedSec] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [editingReel, setEditingReel] = useState<GeneratedReel | null>(null);
  const [theaterIndex, setTheaterIndex] = useState<number | null>(null);

  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);

  const focusComposer = () => {
    promptInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => promptInputRef.current?.focus(), 200);
  };

  const handleGenerate = async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setRenderProgress(0.08);
    setRenderElapsedSec(0);
    setRenderStage("Choreographing scenes...");

    try {
      const response = await fetch("/api/choreograph-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleanPrompt,
          style,
          aspectRatio,
          durationSec,
          imageCount: referenceFrames.length,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.plan) {
        throw new Error(data.error || "Failed to choreograph video scenes.");
      }

      const plan: VideoPlan = data.plan;
      const frameDataUrls = referenceFrames.map((f) => f.dataUrl);

      setRenderStage(`Rendering "${plan.title}"...`);
      const { videoUrl, posterUrl } = await exportPlanToWebM({
        plan,
        aspectRatio,
        durationSec,
        referenceFrames: frameDataUrls,
        showCaptions,
        liveCanvas: liveCanvasRef.current,
        onProgress: (p, elapsed) => {
          setRenderProgress(p);
          setRenderElapsedSec(elapsed);
        },
      });

      const newReel: GeneratedReel = {
        id: `reel-${Date.now()}`,
        prompt: cleanPrompt,
        style,
        aspectRatio,
        durationSec,
        showCaptions,
        plan,
        videoUrl,
        posterUrl,
        referenceFrames: frameDataUrls,
        createdAt: new Date().toISOString(),
      };

      setReels((prev) => [newReel, ...prev]);
      setFilter("all");
      setRenderStage("Complete");
      setRenderProgress(1);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to create video."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndRenderScenes = async (
    reelId: string,
    updatedPlan: VideoPlan,
    updatedCaptions: boolean
  ) => {
    const target = reels.find((r) => r.id === reelId);
    if (!target) return;

    const { videoUrl, posterUrl } = await exportPlanToWebM({
      plan: updatedPlan,
      aspectRatio: target.aspectRatio,
      durationSec: target.durationSec,
      referenceFrames: target.referenceFrames,
      showCaptions: updatedCaptions,
    });

    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId
          ? {
              ...r,
              plan: updatedPlan,
              showCaptions: updatedCaptions,
              videoUrl,
              posterUrl,
              isStarter: false,
            }
          : r
      )
    );
  };

  const handleExportStarterVideo = async (reel: GeneratedReel) => {
    const { videoUrl, posterUrl } = await exportPlanToWebM({
      plan: reel.plan,
      aspectRatio: reel.aspectRatio,
      durationSec: reel.durationSec,
      referenceFrames: reel.referenceFrames,
      showCaptions: reel.showCaptions,
    });

    setReels((prev) =>
      prev.map((r) =>
        r.id === reel.id ? { ...r, videoUrl, posterUrl, isStarter: false } : r
      )
    );

    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `${
      reel.plan.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "kinoframe-reel"
    }.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDuplicatePrompt = (reel: GeneratedReel) => {
    setPrompt(reel.prompt);
    setAspectRatio(reel.aspectRatio);
    setDurationSec(
      ([4, 6, 8, 12].includes(reel.durationSec) ? reel.durationSec : 6) as
        | 4
        | 6
        | 8
        | 12
    );
    setStyle(reel.style);
    setShowCaptions(reel.showCaptions);
    focusComposer();
  };

  const filteredReels = reels.filter((r) => {
    if (filter === "exported") return Boolean(r.videoUrl);
    if (filter === "drafts") return !r.videoUrl;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <StudioHeader onFocusComposer={focusComposer} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <VideoComposer
          prompt={prompt}
          onPromptChange={setPrompt}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          durationSec={durationSec}
          onDurationChange={setDurationSec}
          style={style}
          onStyleChange={setStyle}
          showCaptions={showCaptions}
          onShowCaptionsChange={setShowCaptions}
          referenceFrames={referenceFrames}
          onReferenceFramesChange={setReferenceFrames}
          isGenerating={isGenerating}
          renderStage={renderStage}
          renderProgress={renderProgress}
          renderElapsedSec={renderElapsedSec}
          errorMessage={errorMessage}
          liveCanvasRef={liveCanvasRef}
          promptInputRef={promptInputRef}
          onGenerate={handleGenerate}
        />

        {/* Prompt Starters */}
        <section id="prompt-starters" className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Prompt Starters
            </h2>
            <span className="text-xs text-muted-foreground">
              Click any starter to load its camera and duration settings
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROMPT_STARTERS.map((starter) => (
              <button
                key={starter.id}
                type="button"
                onClick={() => {
                  setPrompt(starter.prompt);
                  setStyle(starter.style);
                  setAspectRatio(starter.aspectRatio);
                  setDurationSec(starter.durationSec);
                  focusComposer();
                }}
                className="text-left p-4 rounded-xl border border-border bg-card hover:bg-muted/60 transition-colors flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {starter.label}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {starter.prompt}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground font-mono tabular-nums">
                  {starter.aspectRatio} · {starter.durationSec}s · {starter.style}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Reel Library */}
        <section id="reel-library" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Reel Library
              </h2>
              <p className="text-sm text-muted-foreground">
                Hover any reel to preview playback, open Scene Director to edit,
                or export as WebM.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filter === "all"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({reels.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("exported")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filter === "exported"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Rendered ({reels.filter((r) => Boolean(r.videoUrl)).length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("drafts")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filter === "drafts"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Interactive ({reels.filter((r) => !r.videoUrl).length})
              </button>
            </div>
          </div>

          {filteredReels.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
              <p className="font-display text-lg font-medium text-foreground">
                No reels in this view yet
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Enter a scene prompt above to choreograph and encode your first
                video reel.
              </p>
              <button
                type="button"
                onClick={focusComposer}
                className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Create First Video
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReels.map((reel) => (
                <ReelCard
                  key={reel.id}
                  reel={reel}
                  onExpand={(r) => {
                    const idx = reels.findIndex((item) => item.id === r.id);
                    setTheaterIndex(idx >= 0 ? idx : 0);
                  }}
                  onEditScenes={(r) => setEditingReel(r)}
                  onDuplicatePrompt={handleDuplicatePrompt}
                  onExportVideo={handleExportStarterVideo}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>KinoFrame Video Studio</span>
          <span>Browser-native WebM rendering with AI scene choreography</span>
        </div>
      </footer>

      <SceneEditorModal
        reel={editingReel}
        isOpen={Boolean(editingReel)}
        onClose={() => setEditingReel(null)}
        onSaveAndRender={handleSaveAndRenderScenes}
      />

      <FocusedMediaView
        isOpen={theaterIndex !== null}
        onClose={() => setTheaterIndex(null)}
        reels={reels}
        initialIndex={theaterIndex ?? 0}
        onEditScenes={(r) => setEditingReel(r)}
        onExportVideo={handleExportStarterVideo}
      />
    </div>
  );
}
