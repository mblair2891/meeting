import { neon } from "@neondatabase/serverless";

export function getDb() {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL environment variable is not set");
  }
  return neon(process.env.POSTGRES_URL);
}

export async function initDb() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      name TEXT DEFAULT '',
      topic_title TEXT NOT NULL,
      question_1_response TEXT DEFAULT '',
      question_2_response TEXT DEFAULT '',
      question_3_response TEXT DEFAULT '',
      category TEXT DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
}
