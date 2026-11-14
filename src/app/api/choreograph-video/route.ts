import { NextRequest, NextResponse } from "next/server";
import { ThinkingLevel, Type } from "@google/genai";
import { getServerAI } from "@/lib/gemini";
import type {
  AspectRatioOption,
  CameraMotion,
  SceneTransition,
  VideoPlan,
  VideoStyleOption,
  VisualMotif,
} from "@/types/video";

const VALID_MOTIFS: VisualMotif[] = [
  "horizon-waves",
  "orbital-rings",
  "light-beams",
  "geometric-grid",
  "particle-field",
  "aurora-mesh",
];

const VALID_MOTIONS: CameraMotion[] = [
  "zoom-in",
  "zoom-out",
  "pan-left",
  "pan-right",
  "orbit",
  "drift",
];

const VALID_TRANSITIONS: SceneTransition[] = ["crossfade", "wipe", "cut"];

function clampHex(hex: unknown, fallback: string): string {
  if (typeof hex === "string" && /^#[0-9a-fA-F]{6}$/.test(hex.trim())) {
    return hex.trim();
  }
  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const style: VideoStyleOption = body?.style || "Cinematic Noir";
    const aspectRatio: AspectRatioOption =
      body?.aspectRatio === "9:16" || body?.aspectRatio === "1:1"
        ? body.aspectRatio
        : "16:9";
    const requestedDuration = Number(body?.durationSec) || 6;
    const durationSec = [4, 6, 8, 12].includes(requestedDuration)
      ? requestedDuration
      : 6;
    const imageCount = Math.max(0, Math.min(4, Number(body?.imageCount) || 0));

    if (!prompt) {
      return NextResponse.json(
        { error: "Please describe the video you want to create." },
        { status: 400 }
      );
    }

    const sceneCount = durationSec >= 12 ? 4 : 3;
    const ai = getServerAI();

    const systemInstruction = `You are a motion picture director and title sequence designer.
Convert the user's video concept into a cohesive ${sceneCount}-scene motion video choreography plan totaling ${durationSec} seconds.
Visual direction style: "${style}". Aspect ratio: ${aspectRatio}.
${imageCount > 0 ? `The user provided ${imageCount} reference image(s) (indexed 0 to ${imageCount - 1}) to animate across the scenes.` : "No external photos were provided, so craft evocative procedural visual motifs."}
Rules:
- Keep scene headlines short (2 to 5 words) and editorial, never generic filler.
- Keep subtitles concise (4 to 9 words) expanding the visual narrative.
- Choose rich, tasteful, cinema-grade hex colors for the palette with high legibility between background and text.
- Vary cameraMotion and visualMotif across scenes so the video feels alive and purposeful.
- Ensure scene durationSec values are positive numbers that sum closely to ${durationSec}.`;

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `Direct a ${durationSec}-second ${style} video for: "${prompt}"`,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Concise 2-5 word title for the video reel.",
            },
            mood: {
              type: Type.STRING,
              description: "2-4 word atmospheric lighting and pacing note.",
            },
            palette: {
              type: Type.OBJECT,
              properties: {
                background: { type: Type.STRING },
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING },
                accent: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ["background", "primary", "secondary", "accent", "text"],
            },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  durationSec: { type: Type.NUMBER },
                  headline: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  cameraMotion: {
                    type: Type.STRING,
                    description:
                      "One of: zoom-in, zoom-out, pan-left, pan-right, orbit, drift",
                  },
                  visualMotif: {
                    type: Type.STRING,
                    description:
                      "One of: horizon-waves, orbital-rings, light-beams, geometric-grid, particle-field, aurora-mesh",
                  },
                  transition: {
                    type: Type.STRING,
                    description: "One of: crossfade, wipe, cut",
                  },
                  focalPoint: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                    },
                    required: ["x", "y"],
                  },
                },
                required: [
                  "durationSec",
                  "headline",
                  "subtitle",
                  "cameraMotion",
                  "visualMotif",
                  "transition",
                  "focalPoint",
                ],
              },
            },
          },
          required: ["title", "mood", "palette", "scenes"],
        },
      },
    });

    const rawText = (response.text ?? "{}").trim();
    const parsed = JSON.parse(rawText);

    const rawScenes = Array.isArray(parsed?.scenes) && parsed.scenes.length > 0
      ? parsed.scenes.slice(0, 6)
      : [
          {
            durationSec: durationSec / 3,
            headline: "Opening Frame",
            subtitle: prompt.slice(0, 48),
            cameraMotion: "zoom-in",
            visualMotif: "light-beams",
            transition: "crossfade",
            focalPoint: { x: 0.5, y: 0.45 },
          },
          {
            durationSec: durationSec / 3,
            headline: "Rising Motion",
            subtitle: "Atmosphere shifts across the horizon",
            cameraMotion: "pan-right",
            visualMotif: "horizon-waves",
            transition: "crossfade",
            focalPoint: { x: 0.6, y: 0.5 },
          },
          {
            durationSec: durationSec / 3,
            headline: "Final Reveal",
            subtitle: "Quiet light settles on the frame",
            cameraMotion: "zoom-out",
            visualMotif: "particle-field",
            transition: "crossfade",
            focalPoint: { x: 0.5, y: 0.5 },
          },
        ];

    const totalRaw = rawScenes.reduce(
      (acc: number, s: { durationSec?: number }) =>
        acc + (Number(s?.durationSec) > 0 ? Number(s.durationSec) : 1),
      0
    );

    interface RawSceneInput {
      durationSec?: unknown;
      headline?: unknown;
      subtitle?: unknown;
      cameraMotion?: unknown;
      visualMotif?: unknown;
      transition?: unknown;
      focalPoint?: { x?: unknown; y?: unknown };
    }

    const normalizedScenes = (rawScenes as RawSceneInput[]).map((s, idx) => {
      const weight = Number(s?.durationSec) > 0 ? Number(s.durationSec) : 1;
      const scaledDuration = Number(((weight / totalRaw) * durationSec).toFixed(2));
      const motif = VALID_MOTIFS.includes(s?.visualMotif as VisualMotif)
        ? (s.visualMotif as VisualMotif)
        : VALID_MOTIFS[idx % VALID_MOTIFS.length];
      const motion = VALID_MOTIONS.includes(s?.cameraMotion as CameraMotion)
        ? (s.cameraMotion as CameraMotion)
        : VALID_MOTIONS[idx % VALID_MOTIONS.length];
      const transition = VALID_TRANSITIONS.includes(s?.transition as SceneTransition)
        ? (s.transition as SceneTransition)
        : "crossfade";
      const fx = Number(s?.focalPoint?.x);
      const fy = Number(s?.focalPoint?.y);

      return {
        id: `scene-${idx + 1}`,
        durationSec: scaledDuration,
        headline:
          typeof s?.headline === "string" && s.headline.trim()
            ? s.headline.trim().slice(0, 60)
            : `Scene ${idx + 1}`,
        subtitle:
          typeof s?.subtitle === "string" && s.subtitle.trim()
            ? s.subtitle.trim().slice(0, 90)
            : "",
        cameraMotion: motion,
        visualMotif: motif,
        transition,
        focalPoint: {
          x: Number.isFinite(fx) ? Math.max(0.15, Math.min(0.85, fx)) : 0.5,
          y: Number.isFinite(fy) ? Math.max(0.15, Math.min(0.85, fy)) : 0.5,
        },
        imageIndex: imageCount > 0 ? idx % imageCount : undefined,
      };
    });

    // Ensure exact sum on the last scene
    const sumBeforeLast = normalizedScenes
      .slice(0, -1)
      .reduce((sum: number, s: { durationSec: number }) => sum + s.durationSec, 0);
    if (normalizedScenes.length > 0) {
      normalizedScenes[normalizedScenes.length - 1].durationSec = Number(
        Math.max(0.5, durationSec - sumBeforeLast).toFixed(2)
      );
    }

    const plan: VideoPlan = {
      title:
        typeof parsed?.title === "string" && parsed.title.trim()
          ? parsed.title.trim().slice(0, 60)
          : "Untitled Reel",
      mood:
        typeof parsed?.mood === "string" && parsed.mood.trim()
          ? parsed.mood.trim().slice(0, 50)
          : style,
      palette: {
        background: clampHex(parsed?.palette?.background, "#0B0D12"),
        primary: clampHex(parsed?.palette?.primary, "#1E293B"),
        secondary: clampHex(parsed?.palette?.secondary, "#334155"),
        accent: clampHex(parsed?.palette?.accent, "#E11D48"),
        text: clampHex(parsed?.palette?.text, "#F8FAFC"),
      },
      scenes: normalizedScenes,
    };

    return NextResponse.json({ plan });
  } catch (error: unknown) {
    console.error("Error in /api/choreograph-video:", error);
    const err = error as { message?: string; status?: number };
    const message = err?.message || "Failed to choreograph video scenes.";
    return NextResponse.json({ error: message }, { status: err?.status || 500 });
  }
}
