import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, topic_title, question_1_response, question_2_response, question_3_response } = body;

    if (!topic_title || !topic_title.trim()) {
      return NextResponse.json({ error: "Topic title is required" }, { status: 400 });
    }

    await initDb();
    const sql = getDb();

    const result = await sql`
      INSERT INTO topics (name, topic_title, question_1_response, question_2_response, question_3_response)
      VALUES (${name || ""}, ${topic_title}, ${question_1_response || ""}, ${question_2_response || ""}, ${question_3_response || ""})
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error("Error creating topic:", error);
    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 });
  }
}
