import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "../src/db";

await migrate(db, { migrationsFolder: "drizzle" });
