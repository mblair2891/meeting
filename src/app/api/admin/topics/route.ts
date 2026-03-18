import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  return authHeader === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await initDb();
    const sql = getDb();
    const topics = await sql`SELECT * FROM topics ORDER BY created_at DESC`;
    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    const sql = getDb();
    await sql`DELETE FROM topics WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, name, topic_title, question_1_response, question_2_response, question_3_response, category } =
      await request.json();

    if (!id) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      UPDATE topics SET
        name = ${name || ""},
        topic_title = ${topic_title},
        question_1_response = ${question_1_response || ""},
        question_2_response = ${question_2_response || ""},
        question_3_response = ${question_3_response || ""},
        category = ${category || ""}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json({ error: "Failed to update topic" }, { status: 500 });
  }
}
