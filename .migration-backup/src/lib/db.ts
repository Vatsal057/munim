import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

let schemaReady: Promise<void> | null = null;

export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const schemaPath = path.join(process.cwd(), "src/lib/schema.sql");
      const sql = fs.readFileSync(schemaPath, "utf8");
      await pool.query(sql);
    })();
  }
  return schemaReady;
}

export default pool;
