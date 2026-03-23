import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  try {
    await initDb();
    const sql = getDb();
    const topics = await sql`SELECT id, name, topic_title, question_1_response, question_2_response, question_3_response, upvotes, created_at FROM topics ORDER BY created_at DESC`;
    const comments = await sql`SELECT id, topic_id, author, body, created_at FROM comments ORDER BY created_at ASC`;

    const commentsByTopic: Record<number, typeof comments> = {};
    for (const c of comments) {
      if (!commentsByTopic[c.topic_id]) commentsByTopic[c.topic_id] = [];
      commentsByTopic[c.topic_id].push(c);
    }

    const topicsWithComments = topics.map((t) => ({
      ...t,
      comments: commentsByTopic[t.id] || [],
    }));

    return NextResponse.json({ topics: topicsWithComments });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }
}

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
