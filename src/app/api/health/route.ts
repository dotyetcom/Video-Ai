import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY),
  });
}
