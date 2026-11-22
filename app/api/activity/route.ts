import { NextResponse } from "next/server";
import { getFeed } from "@/lib/site/activity";

export const revalidate = 20;

export async function GET() {
  const feed = await getFeed();
  return NextResponse.json(feed, { headers: { "Cache-Control": "public, max-age=10, s-maxage=20, stale-while-revalidate=60" } });
}
