import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { topic_id } = await request.json();
    if (!topic_id) {
      return NextResponse.json({ error: "topic_id is required" }, { status: 400 });
    }

    await initDb();
    const sql = getDb();
    const result = await sql`
      UPDATE topics SET upvotes = upvotes + 1 WHERE id = ${topic_id} RETURNING upvotes
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({ upvotes: result[0].upvotes });
  } catch (error) {
    console.error("Error upvoting:", error);
    return NextResponse.json({ error: "Failed to upvote" }, { status: 500 });
  }
}
