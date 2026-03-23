import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { topic_id, author, body } = await request.json();
    if (!topic_id || !body?.trim()) {
      return NextResponse.json({ error: "topic_id and body are required" }, { status: 400 });
    }

    await initDb();
    const sql = getDb();
    const result = await sql`
      INSERT INTO comments (topic_id, author, body)
      VALUES (${topic_id}, ${author || ""}, ${body.trim()})
      RETURNING id, topic_id, author, body, created_at
    `;

    return NextResponse.json({ comment: result[0] });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
