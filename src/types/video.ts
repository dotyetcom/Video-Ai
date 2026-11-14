export type AspectRatioOption = "16:9" | "9:16" | "1:1";

export type VideoStyleOption =
  | "Cinematic Noir"
  | "Editorial Motion"
  | "Atmospheric Abstract"
  | "Kinetic Typography"
  | "Minimalist Studio";

export type CameraMotion =
  | "zoom-in"
  | "zoom-out"
  | "pan-left"
  | "pan-right"
  | "orbit"
  | "drift";

export type VisualMotif =
  | "horizon-waves"
  | "orbital-rings"
  | "light-beams"
  | "geometric-grid"
  | "particle-field"
  | "aurora-mesh";

export type SceneTransition = "crossfade" | "wipe" | "cut";

export interface VideoScene {
  id: string;
  durationSec: number;
  headline: string;
  subtitle: string;
  cameraMotion: CameraMotion;
  visualMotif: VisualMotif;
  transition: SceneTransition;
  focalPoint: {
    x: number;
    y: number;
  };
  imageIndex?: number;
}

export interface VideoPalette {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

export interface VideoPlan {
  title: string;
  mood: string;
  palette: VideoPalette;
  scenes: VideoScene[];
}

export interface ReferenceFrame {
  id: string;
  name: string;
  dataUrl: string;
}

export interface GeneratedReel {
  id: string;
  prompt: string;
  style: VideoStyleOption;
  aspectRatio: AspectRatioOption;
  durationSec: number;
  showCaptions: boolean;
  plan: VideoPlan;
  videoUrl: string | null;
  posterUrl: string | null;
  referenceFrames: string[];
  createdAt: string;
  isStarter?: boolean;
}
