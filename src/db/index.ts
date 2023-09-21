import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

neonConfig.fetchConnectionCache = true;

const sql = neon(Bun.env.NEON_DATABASE_URL!);
export const db = drizzle(sql);
