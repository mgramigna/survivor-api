import { Result, err, ok } from "neverthrow";
import { Season, seasons } from "../db/schema";
import { and, eq, ilike } from "drizzle-orm";
import { db } from "../db";
import { P, match } from "ts-pattern";

type SeasonService = {
  readByNumber: (seasonNumber: number) => Promise<Result<Season, "NOT_FOUND">>;
  search: (args: { name?: string }) => Promise<Result<Season[], never>>;
};

export const seasonService: SeasonService = {
  readByNumber: async (seasonNumber) => {
    const seasonsRes = await db
      .select()
      .from(seasons)
      .where(eq(seasons.seasonNumber, seasonNumber))
      .limit(1);

    return match(seasonsRes.length)
      .with(0, () => err("NOT_FOUND" as const))
      .otherwise(() => ok(seasonsRes[0]));
  },
  search: async (args) => {
    return match(args)
      .with({ name: P.string }, async ({ name }) => {
        const seasonsRes = await db
          .select()
          .from(seasons)
          .where(ilike(seasons.name, `${name}%`));

        return ok(seasonsRes);
      })
      .otherwise(async () => {
        const seasonsRes = await db.select().from(seasons);
        return ok(seasonsRes);
      });
  },
};
