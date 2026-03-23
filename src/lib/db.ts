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
      upvotes INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  await sql`
    DO $$ BEGIN
      ALTER TABLE topics ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
    EXCEPTION WHEN others THEN NULL;
    END $$
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      author TEXT DEFAULT '',
      body TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
}
