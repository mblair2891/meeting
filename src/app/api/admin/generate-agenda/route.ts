import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDb, initDb } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Claude API key not configured" }, { status: 500 });
    }

    await initDb();
    const sql = getDb();
    const topics = await sql`SELECT * FROM topics ORDER BY created_at ASC`;

    if (topics.length === 0) {
      return NextResponse.json({ error: "No topics to generate agenda from" }, { status: 400 });
    }

    const topicSummary = topics
      .map((t, i) => {
        let entry = `${i + 1}. Topic: ${t.topic_title}`;
        if (t.name) entry += `\n   Submitted by: ${t.name}`;
        if (t.question_1_response) entry += `\n   Incident/Pattern: ${t.question_1_response}`;
        if (t.question_2_response) entry += `\n   Impact on staff/customers: ${t.question_2_response}`;
        if (t.question_3_response) entry += `\n   Ideal solution: ${t.question_3_response}`;
        return entry;
      })
      .join("\n\n");

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: "You are a professional meeting facilitator. Organize the following topics into a well-structured meeting agenda. Group related topics, prioritize by urgency/impact, add estimated time for each item (in minutes), and provide brief notes on discussion points. Format as a clear, actionable agenda.",
      messages: [
        {
          role: "user",
          content: `Here are the submitted topics for our next team meeting:\n\n${topicSummary}\n\nPlease create an organized meeting agenda.`,
        },
      ],
    });

    const agendaText =
      message.content[0].type === "text" ? message.content[0].text : "Failed to generate agenda";

    return NextResponse.json({ agenda: agendaText });
  } catch (error) {
    console.error("Error generating agenda:", error);
    return NextResponse.json({ error: "Failed to generate agenda" }, { status: 500 });
  }
}
