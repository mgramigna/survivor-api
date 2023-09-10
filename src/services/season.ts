import { Result, err, ok } from "neverthrow";
import { Season, seasons } from "../db/schema";
import { and, eq, ilike } from "drizzle-orm";
import { db } from "../db";
import { P, match } from "ts-pattern";
import { DBError, NotFoundError, UnknownError } from "../types/errors";

type SeasonService = {
  readByNumber: (
    seasonNumber: number,
  ) => Promise<Result<Season, NotFoundError | DBError | UnknownError>>;
  search: (args: {
    name?: string;
  }) => Promise<Result<Season[], DBError | UnknownError>>;
};

export const seasonService: SeasonService = {
  readByNumber: async (seasonNumber) => {
    try {
      const seasonsRes = await db
        .select()
        .from(seasons)
        .where(eq(seasons.seasonNumber, seasonNumber))
        .limit(1);

      return match(seasonsRes.length)
        .with(0, () =>
          err({
            type: "NOT_FOUND",
            message: `Season ${seasonNumber} was not found in the database`,
          } satisfies NotFoundError),
        )
        .otherwise(() => ok(seasonsRes[0]));
    } catch (e) {
      if (e instanceof Error) {
        return err({
          type: "DATABASE_ERROR",
          message: `Error occurred querying the database: ${e.message}`,
        } satisfies DBError);
      }

      return err({
        type: "UNKNOWN",
        message: "An unknown error occurred",
      } satisfies UnknownError);
    }
  },
  search: async (args) => {
    return match(args)
      .with({ name: P.string }, async ({ name }) => {
        try {
          const seasonsRes = await db
            .select()
            .from(seasons)
            .where(ilike(seasons.name, `${name}%`));

          return ok(seasonsRes);
        } catch (e) {
          if (e instanceof Error) {
            return err({
              type: "DATABASE_ERROR",
              message: `Error occurred querying the database: ${e.message}`,
            } satisfies DBError);
          }

          return err({
            type: "UNKNOWN",
            message: "An unknown error occurred",
          } satisfies UnknownError);
        }
      })
      .otherwise(async () => {
        const seasonsRes = await db.select().from(seasons);
        return ok(seasonsRes);
      });
  },
};
