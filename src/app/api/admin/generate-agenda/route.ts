import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getDb, initDb } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { meetingDate, meetingTime, meetingLocation } = body;

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

    let meetingDetails = "";
    if (meetingDate || meetingTime || meetingLocation) {
      const parts = [];
      if (meetingDate) parts.push(`Date: ${meetingDate}`);
      if (meetingTime) parts.push(`Time: ${meetingTime}`);
      if (meetingLocation) parts.push(`Location: ${meetingLocation}`);
      meetingDetails = `\n\nMeeting Details:\n${parts.join("\n")}`;
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      messages: [
        {
          role: "system",
          content: `You are a thoughtful and experienced meeting facilitator. Your job is to take submitted team topics and turn them into a well-organized meeting agenda that feels natural and easy to follow — not a rigid outline full of bullet points.

Write in a warm, conversational tone as if you're a colleague preparing the team for a productive discussion. Use full sentences and flowing paragraphs rather than bullet-point lists.

For each topic or group of related topics, include:
- A brief summary of what was raised and why it matters
- Possible solutions or approaches the team could consider, drawing from what submitters suggested and your own practical ideas
- A clear action plan with suggested next steps, owners where possible, and realistic timeframes

Group related topics together naturally. Prioritize items by urgency and impact. Include estimated discussion time for each section.

Start the agenda with a short welcome and overview, and end with a wrap-up section that includes any follow-up actions.`,
        },
        {
          role: "user",
          content: `Here are the submitted topics for our upcoming team meeting:\n\n${topicSummary}${meetingDetails}\n\nPlease create an organized, conversational meeting agenda with possible solutions and an action plan for each topic.`,
        },
      ],
    });

    const agendaText = completion.choices[0]?.message?.content ?? "Failed to generate agenda";

    return NextResponse.json({ agenda: agendaText });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error generating agenda:", message);
    return NextResponse.json({ error: `Failed to generate agenda: ${message}` }, { status: 500 });
  }
}
