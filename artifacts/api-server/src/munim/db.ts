import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

/**
 * The schema (schema.sql) is applied to the development database ahead of time and
 * carried to production by Replit's publish flow, so no DDL runs at request time.
 * Kept as a no-op so the original call sites stay unchanged.
 */
export function ensureSchema(): Promise<void> {
  return Promise.resolve();
}

/** Applies schema.sql explicitly (used by the seed script for fresh databases). */
export async function applySchemaFile() {
  const schemaPath = path.join(process.cwd(), "src/munim/schema.sql");
  await pool.query(fs.readFileSync(schemaPath, "utf8"));
}

export default pool;
