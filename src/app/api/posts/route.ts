import { NextResponse } from "next/server";

import { getPostsRepository } from "@/lib/posts/repository";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ posts: getPostsRepository().list() });
}
