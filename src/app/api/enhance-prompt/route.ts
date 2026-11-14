import { NextRequest, NextResponse } from "next/server";
import { ThinkingLevel } from "@google/genai";
import { getServerAI } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const style = typeof body?.style === "string" ? body.style : "Cinematic Noir";

    if (!prompt) {
      return NextResponse.json(
        { error: "Enter a short idea first so it can be expanded." },
        { status: 400 }
      );
    }

    const ai = getServerAI();
    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `Style: ${style}\nRaw concept: ${prompt}`,
      config: {
        systemInstruction:
          "You are a cinematographer refining a brief video idea into a vivid 1-2 sentence director's prompt. Describe concrete camera movement, lighting, atmosphere, and subject motion. Return only the refined prompt text with no quotes or preamble.",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const enhanced = (response.text ?? "").trim();
    if (!enhanced) {
      return NextResponse.json(
        { error: "Could not enhance prompt. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ prompt: enhanced });
  } catch (error: unknown) {
    console.error("Error in /api/enhance-prompt:", error);
    const err = error as { message?: string; status?: number };
    return NextResponse.json(
      { error: err?.message || "Failed to enhance prompt." },
      { status: err?.status || 500 }
    );
  }
}
