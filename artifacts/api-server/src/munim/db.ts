import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

let schemaReady: Promise<void> | null = null;

/** Applies schema.sql once per process; every statement is `if not exists`, so this is safe on a live DB. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) schemaReady = applySchemaFile().catch((err) => { schemaReady = null; throw err; });
  return schemaReady;
}

/** Applies schema.sql explicitly (used by the seed script for fresh databases). */
export async function applySchemaFile() {
  const schemaPath = path.join(process.cwd(), "src/munim/schema.sql");
  await pool.query(fs.readFileSync(schemaPath, "utf8"));
}

export default pool;
