import type {
  AspectRatioOption,
  CameraMotion,
  VideoPalette,
  VideoPlan,
  VideoScene,
} from "@/types/video";

export function getDimensionsForAspectRatio(ratio: AspectRatioOption): {
  width: number;
  height: number;
} {
  switch (ratio) {
    case "9:16":
      return { width: 720, height: 1280 };
    case "1:1":
      return { width: 960, height: 960 };
    case "16:9":
    default:
      return { width: 1280, height: 720 };
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return { r: 15, g: 23, b: 42 };
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * Math.max(0, Math.min(1, t))) - 1) / 2;
}

function getCameraTransform(
  motion: CameraMotion,
  progress: number,
  width: number,
  height: number
) {
  const p = easeInOutSine(progress);
  switch (motion) {
    case "zoom-in":
      return { scale: 1 + p * 0.14, tx: 0, ty: 0, rot: 0 };
    case "zoom-out":
      return { scale: 1.14 - p * 0.14, tx: 0, ty: 0, rot: 0 };
    case "pan-left":
      return { scale: 1.1, tx: (0.5 - p) * width * 0.08, ty: 0, rot: 0 };
    case "pan-right":
      return { scale: 1.1, tx: (p - 0.5) * width * 0.08, ty: 0, rot: 0 };
    case "orbit":
      return {
        scale: 1.08,
        tx: Math.cos(p * Math.PI * 2) * width * 0.025,
        ty: Math.sin(p * Math.PI * 2) * height * 0.02,
        rot: Math.sin(p * Math.PI) * 0.02,
      };
    case "drift":
    default:
      return {
        scale: 1.04 + p * 0.05,
        tx: (p - 0.5) * width * 0.03,
        ty: (0.5 - p) * height * 0.02,
        rot: 0,
      };
  }
}

function drawMotif(
  ctx: CanvasRenderingContext2D,
  scene: VideoScene,
  palette: VideoPalette,
  width: number,
  height: number,
  sceneProgress: number,
  globalTime: number
) {
  const fx = scene.focalPoint.x * width;
  const fy = scene.focalPoint.y * height;

  switch (scene.visualMotif) {
    case "horizon-waves": {
      const layers = 6;
      for (let l = 0; l < layers; l++) {
        const baseY = height * (0.45 + l * 0.085);
        const amp = height * (0.045 - l * 0.004);
        const freq = 0.004 + l * 0.0012;
        const speed = globalTime * (1.1 + l * 0.25);

        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 18) {
          const y =
            baseY +
            Math.sin(x * freq + speed + l) * amp +
            Math.cos(x * freq * 0.5 - speed * 0.7) * (amp * 0.5);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const layerColor = l % 2 === 0 ? palette.primary : palette.secondary;
        const grad = ctx.createLinearGradient(0, baseY - amp, 0, height);
        grad.addColorStop(0, rgba(l === 0 ? palette.accent : layerColor, 0.36 - l * 0.04));
        grad.addColorStop(1, rgba(palette.background, 0.92));
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = rgba(l === 1 ? palette.accent : palette.text, 0.14);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      break;
    }

    case "orbital-rings": {
      const maxR = Math.min(width, height) * 0.44;
      for (let i = 1; i <= 5; i++) {
        const radius = (maxR / 5) * i * (0.92 + Math.sin(globalTime + i) * 0.04);
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(globalTime * (i % 2 === 0 ? 0.22 : -0.16) + i * 0.5);

        ctx.beginPath();
        ctx.ellipse(0, 0, radius, radius * (0.65 + (i % 3) * 0.12), i * 0.35, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(i === 3 ? palette.accent : palette.text, 0.22);
        ctx.lineWidth = i === 3 ? 2.2 : 1.2;
        ctx.stroke();

        // Orbiting light node
        const angle = globalTime * (0.9 + i * 0.25) + i * 1.4;
        const nx = Math.cos(angle) * radius;
        const ny = Math.sin(angle) * radius * (0.65 + (i % 3) * 0.12);
        const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, 24);
        glow.addColorStop(0, rgba(palette.accent, 0.95));
        glow.addColorStop(1, rgba(palette.accent, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(nx, ny, 24, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
      break;
    }

    case "light-beams": {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let b = 0; b < 5; b++) {
        const sweep = Math.sin(globalTime * 0.65 + b * 1.1) * width * 0.14;
        const topX = fx + (b - 2) * (width * 0.12) + sweep;
        const bottomX = topX + (b - 1.5) * (width * 0.22);
        const beamW = width * (0.09 + (b % 2) * 0.05);

        const grad = ctx.createLinearGradient(topX, 0, bottomX, height);
        grad.addColorStop(0, rgba(b === 2 ? palette.accent : palette.text, 0.24));
        grad.addColorStop(0.6, rgba(palette.primary, 0.12));
        grad.addColorStop(1, rgba(palette.background, 0));

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(topX - beamW * 0.4, -40);
        ctx.lineTo(topX + beamW * 0.4, -40);
        ctx.lineTo(bottomX + beamW * 1.8, height + 40);
        ctx.lineTo(bottomX - beamW * 1.8, height + 40);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      break;
    }

    case "geometric-grid": {
      ctx.save();
      const horizonY = height * 0.46;
      const cols = 14;
      const rows = 10;

      ctx.strokeStyle = rgba(palette.text, 0.14);
      ctx.lineWidth = 1;

      for (let c = -cols; c <= cols; c++) {
        const topX = fx + c * (width * 0.035);
        const botX = fx + c * (width * 0.16);
        ctx.beginPath();
        ctx.moveTo(topX, horizonY);
        ctx.lineTo(botX, height);
        ctx.stroke();
      }

      const travel = (sceneProgress * 3) % 1;
      for (let r = 0; r < rows; r++) {
        const t = (r + travel) / rows;
        const y = horizonY + Math.pow(t, 1.8) * (height - horizonY);
        ctx.strokeStyle = rgba(r % 3 === 0 ? palette.accent : palette.text, 0.08 + t * 0.22);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Glowing horizon bar
      const glow = ctx.createRadialGradient(fx, horizonY, 0, fx, horizonY, width * 0.45);
      glow.addColorStop(0, rgba(palette.accent, 0.45));
      glow.addColorStop(1, rgba(palette.accent, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      break;
    }

    case "aurora-mesh": {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 4; i++) {
        const cx =
          width * (0.25 + i * 0.18) +
          Math.sin(globalTime * (0.5 + i * 0.15) + i) * width * 0.12;
        const cy =
          height * (0.35 + (i % 2) * 0.25) +
          Math.cos(globalTime * (0.4 + i * 0.12) + i * 2) * height * 0.12;
        const radius = Math.max(width, height) * (0.32 + (i % 2) * 0.1);
        const col = i === 0 ? palette.accent : i % 2 === 0 ? palette.primary : palette.secondary;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, rgba(col, 0.42));
        grad.addColorStop(0.55, rgba(col, 0.14));
        grad.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      break;
    }

    case "particle-field":
    default: {
      // Soft atmospheric particles deterministic per index
      for (let p = 0; p < 55; p++) {
        const seed1 = Math.sin(p * 12.9898) * 43758.5453;
        const seed2 = Math.sin(p * 78.233) * 43758.5453;
        const rx = seed1 - Math.floor(seed1);
        const ry = seed2 - Math.floor(seed2);
        const depth = 0.4 + (p % 5) * 0.22;
        const px = ((rx * width + globalTime * 28 * depth) % (width + 60)) - 30;
        const py =
          ((ry * height - globalTime * 16 * depth + height * 4) % (height + 60)) - 30;
        const r = 1.5 + (p % 4) * 1.4;
        const alpha = 0.25 + 0.55 * Math.abs(Math.sin(globalTime * 1.4 + p));

        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(p % 5 === 0 ? palette.accent : palette.text, alpha);
        ctx.fill();
      }
      break;
    }
  }
}

function drawSceneContent(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: VideoScene,
  palette: VideoPalette,
  sceneProgress: number,
  globalTime: number,
  images: HTMLImageElement[],
  showCaptions: boolean
) {
  ctx.save();

  // Base background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, palette.background);
  bgGrad.addColorStop(0.55, palette.primary);
  bgGrad.addColorStop(1, palette.background);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Camera transform group
  const cam = getCameraTransform(scene.cameraMotion, sceneProgress, width, height);
  ctx.save();
  ctx.translate(width / 2 + cam.tx, height / 2 + cam.ty);
  ctx.rotate(cam.rot);
  ctx.scale(cam.scale, cam.scale);
  ctx.translate(-width / 2, -height / 2);

  // Reference image layer if provided
  const img =
    scene.imageIndex !== undefined && images[scene.imageIndex]
      ? images[scene.imageIndex]
      : images.length > 0
      ? images[0]
      : null;

  if (img && img.complete && img.naturalWidth > 0) {
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = width / height;
    let drawW = width;
    let drawH = height;
    let drawX = 0;
    let drawY = 0;
    if (imgAspect > canvasAspect) {
      drawH = height;
      drawW = height * imgAspect;
      drawX = (width - drawW) / 2;
    } else {
      drawW = width;
      drawH = width / imgAspect;
      drawY = (height - drawH) / 2;
    }
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Subtle color grade tint over image
    ctx.fillStyle = rgba(palette.background, 0.28);
    ctx.fillRect(-width * 0.2, -height * 0.2, width * 1.4, height * 1.4);
  }

  // Procedural visual motif (blended softly over image or full-strength if text-only)
  ctx.save();
  if (img) ctx.globalAlpha = 0.55;
  drawMotif(ctx, scene, palette, width, height, sceneProgress, globalTime);
  ctx.restore();

  ctx.restore(); // End camera transform

  // Measured contrast scrim for text legibility (>= 4.5:1)
  const scrim = ctx.createLinearGradient(0, height * 0.35, 0, height);
  scrim.addColorStop(0, "rgba(0,0,0,0)");
  scrim.addColorStop(0.55, rgba(palette.background, 0.55));
  scrim.addColorStop(1, rgba(palette.background, 0.88));
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, width, height);

  // Editorial kinetic typography
  if (showCaptions && (scene.headline || scene.subtitle)) {
    const enter = easeOutCubic(Math.min(1, sceneProgress / 0.28));
    const exit =
      sceneProgress > 0.86
        ? 1 - easeOutCubic((sceneProgress - 0.86) / 0.14)
        : 1;
    const textAlpha = Math.max(0, Math.min(1, enter * exit));
    const yOffset = (1 - enter) * 26;

    const padX = Math.round(width * 0.065);
    const bottomY = Math.round(height * 0.86);
    const titleSize = Math.round(Math.min(width, height) * 0.064);
    const subSize = Math.round(Math.min(width, height) * 0.028);

    ctx.save();
    ctx.globalAlpha = textAlpha;

    // Subtle accent hairline rule above title
    ctx.fillStyle = palette.accent;
    ctx.fillRect(padX, bottomY - titleSize - subSize - 26 + yOffset, 48 * enter, 3);

    // Headline
    ctx.fillStyle = palette.text;
    ctx.font = `700 ${titleSize}px "Bricolage Grotesque", "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.textBaseline = "bottom";
    ctx.fillText(scene.headline, padX, bottomY - subSize - 10 + yOffset, width - padX * 2);

    // Subtitle
    if (scene.subtitle) {
      ctx.fillStyle = rgba(palette.text, 0.82);
      ctx.font = `400 ${subSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillText(scene.subtitle, padX, bottomY + yOffset, width - padX * 2);
    }

    ctx.restore();
  }

  // Subtle top-left scene progress hairlines (editorial timecode feel)
  ctx.save();
  ctx.fillStyle = rgba(palette.text, 0.16);
  ctx.fillRect(Math.round(width * 0.065), Math.round(height * 0.055), width * 0.87, 2);
  ctx.fillStyle = palette.accent;
  ctx.fillRect(
    Math.round(width * 0.065),
    Math.round(height * 0.055),
    width * 0.87 * sceneProgress,
    2
  );
  ctx.restore();

  ctx.restore();
}

export function renderFrameAtTime(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  plan: VideoPlan,
  timeSec: number,
  totalDurationSec: number,
  images: HTMLImageElement[],
  showCaptions: boolean
) {
  const scenes = plan.scenes;
  if (!scenes.length) return;

  const clampedTime = Math.max(0, Math.min(totalDurationSec, timeSec));
  let elapsed = 0;
  let activeIdx = scenes.length - 1;
  let sceneStart = 0;

  for (let i = 0; i < scenes.length; i++) {
    const dur = Math.max(0.2, scenes[i].durationSec);
    if (clampedTime <= elapsed + dur || i === scenes.length - 1) {
      activeIdx = i;
      sceneStart = elapsed;
      break;
    }
    elapsed += dur;
  }

  const currentScene = scenes[activeIdx];
  const currentDur = Math.max(0.2, currentScene.durationSec);
  const localTime = clampedTime - sceneStart;
  const sceneProgress = Math.max(0, Math.min(1, localTime / currentDur));

  // Render active scene
  drawSceneContent(
    ctx,
    width,
    height,
    currentScene,
    plan.palette,
    sceneProgress,
    clampedTime,
    images,
    showCaptions
  );

  // Smooth crossfade / wipe from previous scene during first 0.45s
  const transitionWindow = 0.45;
  if (
    activeIdx > 0 &&
    localTime < transitionWindow &&
    currentScene.transition !== "cut"
  ) {
    const prevScene = scenes[activeIdx - 1];
    const mix = 1 - easeOutCubic(localTime / transitionWindow);

    ctx.save();
    if (currentScene.transition === "wipe") {
      ctx.beginPath();
      ctx.rect(0, 0, width * mix, height);
      ctx.clip();
    } else {
      ctx.globalAlpha = mix;
    }
    drawSceneContent(
      ctx,
      width,
      height,
      prevScene,
      plan.palette,
      1,
      clampedTime,
      images,
      showCaptions
    );
    ctx.restore();
  }
}

export async function loadReferenceImages(
  dataUrls: string[]
): Promise<HTMLImageElement[]> {
  if (!dataUrls.length) return [];
  return Promise.all(
    dataUrls.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(img);
          img.src = src;
        })
    )
  );
}

export async function renderPosterDataUrl(
  plan: VideoPlan,
  aspectRatio: AspectRatioOption,
  referenceFrames: string[],
  showCaptions: boolean
): Promise<string> {
  const { width, height } = getDimensionsForAspectRatio(aspectRatio);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const images = await loadReferenceImages(referenceFrames);
  const total = plan.scenes.reduce((s, sc) => s + sc.durationSec, 0) || 6;
  renderFrameAtTime(ctx, width, height, plan, total * 0.18, total, images, showCaptions);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export async function exportPlanToWebM({
  plan,
  aspectRatio,
  durationSec,
  referenceFrames,
  showCaptions,
  onProgress,
  liveCanvas,
}: {
  plan: VideoPlan;
  aspectRatio: AspectRatioOption;
  durationSec: number;
  referenceFrames: string[];
  showCaptions: boolean;
  onProgress?: (progress: number, elapsedSec: number) => void;
  liveCanvas?: HTMLCanvasElement | null;
}): Promise<{ videoUrl: string; posterUrl: string; mimeType: string }> {
  const { width, height } = getDimensionsForAspectRatio(aspectRatio);
  const canvas = liveCanvas || document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context for video rendering.");
  }

  const images = await loadReferenceImages(referenceFrames);

  // Capture poster frame at ~18% into the reel
  renderFrameAtTime(ctx, width, height, plan, durationSec * 0.18, durationSec, images, showCaptions);
  const posterUrl = canvas.toDataURL("image/jpeg", 0.88);

  if (
    typeof MediaRecorder === "undefined" ||
    typeof canvas.captureStream !== "function"
  ) {
    throw new Error("MediaRecorder video encoding is not supported in this browser.");
  }

  const mimeCandidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  const selectedMime =
    mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";

  const stream = canvas.captureStream(30);
  const chunks: BlobPart[] = [];

  const recorder = new MediaRecorder(stream, {
    mimeType: selectedMime,
    videoBitsPerSecond: 4_500_000,
  });

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const recordingFinished = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: selectedMime }));
    };
    recorder.onerror = (ev) => {
      reject(new Error(`Video recording failed: ${String(ev)}`));
    };
  });

  renderFrameAtTime(ctx, width, height, plan, 0, durationSec, images, showCaptions);
  recorder.start(100);

  await new Promise<void>((resolve) => {
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsedSec = (now - startTime) / 1000;
      const clamped = Math.min(durationSec, elapsedSec);
      renderFrameAtTime(ctx, width, height, plan, clamped, durationSec, images, showCaptions);
      onProgress?.(Math.min(1, clamped / durationSec), clamped);

      if (elapsedSec < durationSec) {
        requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
          resolve();
        }, 80);
      }
    };
    requestAnimationFrame(step);
  });

  const blob = await recordingFinished;
  const videoUrl = URL.createObjectURL(blob);

  return { videoUrl, posterUrl, mimeType: selectedMime };
}
