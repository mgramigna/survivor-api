import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "../src/db";

await migrate(db, { migrationsFolder: "drizzle" });
