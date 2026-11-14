"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CanvasReelPlayer } from "@/components/canvas-reel-player";
import type {
  CameraMotion,
  GeneratedReel,
  SceneTransition,
  VideoPlan,
  VisualMotif,
} from "@/types/video";
import { Loader2, Film } from "lucide-react";

interface SceneEditorModalProps {
  reel: GeneratedReel | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveAndRender: (reelId: string, updatedPlan: VideoPlan, showCaptions: boolean) => Promise<void>;
}

const CAMERA_MOTIONS: { value: CameraMotion; label: string }[] = [
  { value: "zoom-in", label: "Slow Push In" },
  { value: "zoom-out", label: "Pull Back" },
  { value: "pan-left", label: "Pan Left" },
  { value: "pan-right", label: "Pan Right" },
  { value: "orbit", label: "Orbital Sway" },
  { value: "drift", label: "Gentle Drift" },
];

const VISUAL_MOTIFS: { value: VisualMotif; label: string }[] = [
  { value: "horizon-waves", label: "Horizon Waves" },
  { value: "light-beams", label: "Volumetric Beams" },
  { value: "orbital-rings", label: "Orbital Rings" },
  { value: "geometric-grid", label: "Perspective Grid" },
  { value: "particle-field", label: "Atmosphere Particles" },
  { value: "aurora-mesh", label: "Aurora Ribbons" },
];

const TRANSITIONS: { value: SceneTransition; label: string }[] = [
  { value: "crossfade", label: "Crossfade" },
  { value: "wipe", label: "Horizontal Wipe" },
  { value: "cut", label: "Hard Cut" },
];

export function SceneEditorModal({
  reel,
  isOpen,
  onClose,
  onSaveAndRender,
}: SceneEditorModalProps) {
  const [draftPlan, setDraftPlan] = useState<VideoPlan | null>(null);
  const [showCaptions, setShowCaptions] = useState(true);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (reel) {
      setDraftPlan(JSON.parse(JSON.stringify(reel.plan)));
      setShowCaptions(reel.showCaptions);
      setActiveSceneIndex(0);
    }
  }, [reel]);

  if (!reel || !draftPlan) return null;

  const activeScene = draftPlan.scenes[activeSceneIndex] || draftPlan.scenes[0];

  const updateScene = (index: number, patch: Partial<typeof activeScene>) => {
    setDraftPlan((prev) => {
      if (!prev) return prev;
      const nextScenes = prev.scenes.map((s, idx) =>
        idx === index ? { ...s, ...patch } : s
      );
      return { ...prev, scenes: nextScenes };
    });
  };

  const handleApplyAndRender = async () => {
    setIsRendering(true);
    try {
      await onSaveAndRender(reel.id, draftPlan, showCaptions);
      onClose();
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isRendering && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Scene Director — {draftPlan.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-2">
          {/* Live Canvas Preview */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div
              className={`w-full rounded-xl overflow-hidden border border-border bg-zinc-950 ${
                reel.aspectRatio === "9:16"
                  ? "aspect-[9/16] max-h-[420px] mx-auto"
                  : reel.aspectRatio === "1:1"
                  ? "aspect-square max-h-[380px] mx-auto"
                  : "aspect-video"
              }`}
            >
              <CanvasReelPlayer
                plan={draftPlan}
                aspectRatio={reel.aspectRatio}
                durationSec={reel.durationSec}
                referenceFrames={reel.referenceFrames}
                showCaptions={showCaptions}
                autoPlay
              />
            </div>

            {/* Scene selector strip */}
            <div className="flex flex-wrap gap-2">
              {draftPlan.scenes.map((scene, idx) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setActiveSceneIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    activeSceneIndex === idx
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                >
                  Scene {idx + 1} · <span className="font-mono tabular-nums">{scene.durationSec}s</span>
                </button>
              ))}
            </div>

            {/* Palette controls */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Backdrop</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draftPlan.palette.background}
                    onChange={(e) =>
                      setDraftPlan({
                        ...draftPlan,
                        palette: { ...draftPlan.palette, background: e.target.value },
                      })
                    }
                    className="h-8 w-10 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-xs text-muted-foreground uppercase">
                    {draftPlan.palette.background}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Accent</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draftPlan.palette.accent}
                    onChange={(e) =>
                      setDraftPlan({
                        ...draftPlan,
                        palette: { ...draftPlan.palette, accent: e.target.value },
                      })
                    }
                    className="h-8 w-10 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-xs text-muted-foreground uppercase">
                    {draftPlan.palette.accent}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Captions</Label>
                <button
                  type="button"
                  onClick={() => setShowCaptions((prev) => !prev)}
                  className="h-8 px-3 w-full rounded-md border border-border bg-card text-xs font-medium text-left hover:bg-muted transition-colors"
                >
                  {showCaptions ? "Visible" : "Hidden"}
                </button>
              </div>
            </div>
          </div>

          {/* Active Scene Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reel-title" className="text-xs font-medium">
                Reel Title
              </Label>
              <Input
                id="reel-title"
                value={draftPlan.title}
                onChange={(e) => setDraftPlan({ ...draftPlan, title: e.target.value })}
              />
            </div>

            <div className="pt-3 border-t border-border space-y-4">
              <div className="text-xs font-medium text-muted-foreground">
                Editing Scene {activeSceneIndex + 1} of {draftPlan.scenes.length}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="scene-headline" className="text-xs font-medium">
                  On-Screen Headline
                </Label>
                <Input
                  id="scene-headline"
                  value={activeScene.headline}
                  onChange={(e) =>
                    updateScene(activeSceneIndex, { headline: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="scene-subtitle" className="text-xs font-medium">
                  Subtitle Caption
                </Label>
                <Input
                  id="scene-subtitle"
                  value={activeScene.subtitle}
                  onChange={(e) =>
                    updateScene(activeSceneIndex, { subtitle: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Camera Motion</Label>
                <Select
                  value={activeScene.cameraMotion}
                  onValueChange={(val) =>
                    updateScene(activeSceneIndex, {
                      cameraMotion: val as CameraMotion,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMERA_MOTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Visual Motif</Label>
                <Select
                  value={activeScene.visualMotif}
                  onValueChange={(val) =>
                    updateScene(activeSceneIndex, {
                      visualMotif: val as VisualMotif,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISUAL_MOTIFS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Incoming Transition</Label>
                <Select
                  value={activeScene.transition}
                  onValueChange={(val) =>
                    updateScene(activeSceneIndex, {
                      transition: val as SceneTransition,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSITIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isRendering}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApplyAndRender}
            disabled={isRendering}
            className="gap-2"
          >
            {isRendering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Rendering Video...</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4" />
                <span>Re-render Video</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
