import { NextResponse } from "next/server";
import { sqlite } from "@/lib/db";

export async function GET() {
  try {
    const rows = sqlite.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
    const posts = rows.map((r: any) => {
      let parsedTags: string[] = [];
      try {
        parsedTags = r.tags ? JSON.parse(r.tags) : [];
      } catch {
        parsedTags = r.tags ? r.tags.split(",") : [];
      }
      return {
        id: r.id,
        title: r.title,
        content: r.content,
        channel: r.channel,
        status: r.status,
        scheduledAt: r.scheduled_at,
        tags: parsedTags,
        authorName: r.author_name,
        authorHandle: r.author_handle,
        createdAt: r.created_at,
      };
    });

    return NextResponse.json({ posts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
