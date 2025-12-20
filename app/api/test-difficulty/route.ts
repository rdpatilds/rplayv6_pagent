import { NextResponse } from "next/server";
import { getDifficultyLevels } from "@/lib/difficulty-db";

export async function GET() {
  const levels = await getDifficultyLevels();
  return NextResponse.json(levels);
}
