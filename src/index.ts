import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { seasons } from "./db/schema";

const db = drizzle(sql);

const allSeasons = await db.select().from(seasons);
console.log(allSeasons);
