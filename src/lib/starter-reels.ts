import type { GeneratedReel, VideoStyleOption } from "@/types/video";

export interface PromptStarter {
  id: string;
  label: string;
  style: VideoStyleOption;
  aspectRatio: "16:9" | "9:16" | "1:1";
  durationSec: 4 | 6 | 8 | 12;
  prompt: string;
}

export const PROMPT_STARTERS: PromptStarter[] = [
  {
    id: "starter-lighthouse",
    label: "Midnight Lighthouse",
    style: "Cinematic Noir",
    aspectRatio: "16:9",
    durationSec: 6,
    prompt:
      "A solitary lighthouse beam sweeping across stormy midnight waves as amber dawn breaks over the horizon",
  },
  {
    id: "starter-architecture",
    label: "Brutalist Pavilion",
    style: "Editorial Motion",
    aspectRatio: "16:9",
    durationSec: 8,
    prompt:
      "Slow architectural camera glide along warm travertine colonnades with sharp afternoon sunlight and drifting shadows",
  },
  {
    id: "starter-orbital",
    label: "Solaris Telemetry",
    style: "Atmospheric Abstract",
    aspectRatio: "1:1",
    durationSec: 6,
    prompt:
      "Concentric brass orbital rings rotating gently through deep indigo space with luminous dust motes",
  },
  {
    id: "starter-vertical-reel",
    label: "Tokyo Rain Cut",
    style: "Kinetic Typography",
    aspectRatio: "9:16",
    durationSec: 6,
    prompt:
      "Fast vertical title sequence through rain-streaked glass reflections and crimson twilight traffic trails",
  },
];

export const INITIAL_STARTER_REELS: GeneratedReel[] = [
  {
    id: "demo-reel-coastal",
    prompt:
      "Golden hour tide rolling across black basalt cliffs while warm volumetric light cuts through sea mist",
    style: "Cinematic Noir",
    aspectRatio: "16:9",
    durationSec: 6,
    showCaptions: true,
    videoUrl: null,
    posterUrl: null,
    referenceFrames: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    isStarter: true,
    plan: {
      title: "Basalt Horizon",
      mood: "Warm amber mist",
      palette: {
        background: "#0B0E14",
        primary: "#1C2433",
        secondary: "#3B2F2F",
        accent: "#F59E0B",
        text: "#F8FAFC",
      },
      scenes: [
        {
          id: "scene-1",
          durationSec: 2,
          headline: "First Tide",
          subtitle: "Low mist settles across obsidian cliffs",
          cameraMotion: "zoom-in",
          visualMotif: "horizon-waves",
          transition: "crossfade",
          focalPoint: { x: 0.5, y: 0.48 },
        },
        {
          id: "scene-2",
          durationSec: 2,
          headline: "Amber Shafts",
          subtitle: "Late sun breaks through coastal haze",
          cameraMotion: "pan-right",
          visualMotif: "light-beams",
          transition: "crossfade",
          focalPoint: { x: 0.62, y: 0.38 },
        },
        {
          id: "scene-3",
          durationSec: 2,
          headline: "Quiet Shore",
          subtitle: "Warm embers drift above still water",
          cameraMotion: "zoom-out",
          visualMotif: "particle-field",
          transition: "crossfade",
          focalPoint: { x: 0.5, y: 0.5 },
        },
      ],
    },
  },
  {
    id: "demo-reel-orbital",
    prompt:
      "Minimalist aerospace exhibition reel showing planetary rings, precision grid lines, and deep crimson aurora",
    style: "Editorial Motion",
    aspectRatio: "16:9",
    durationSec: 6,
    showCaptions: true,
    videoUrl: null,
    posterUrl: null,
    referenceFrames: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    isStarter: true,
    plan: {
      title: "Meridian Orbit",
      mood: "Precision crimson twilight",
      palette: {
        background: "#09090E",
        primary: "#181826",
        secondary: "#2E1A2B",
        accent: "#E11D48",
        text: "#FAFAFA",
      },
      scenes: [
        {
          id: "scene-1",
          durationSec: 2,
          headline: "Orbital Calibration",
          subtitle: "Gyroscopic rings align on the meridian",
          cameraMotion: "orbit",
          visualMotif: "orbital-rings",
          transition: "crossfade",
          focalPoint: { x: 0.5, y: 0.46 },
        },
        {
          id: "scene-2",
          durationSec: 2,
          headline: "Vector Horizon",
          subtitle: "Architectural telemetry sweeps forward",
          cameraMotion: "zoom-in",
          visualMotif: "geometric-grid",
          transition: "wipe",
          focalPoint: { x: 0.5, y: 0.46 },
        },
        {
          id: "scene-3",
          durationSec: 2,
          headline: "Crimson Veil",
          subtitle: "Soft solar ribbons cross the upper atmosphere",
          cameraMotion: "drift",
          visualMotif: "aurora-mesh",
          transition: "crossfade",
          focalPoint: { x: 0.48, y: 0.42 },
        },
      ],
    },
  },
];
