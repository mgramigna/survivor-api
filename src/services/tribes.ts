import { Result, err, ok } from "neverthrow";
import { Season, Tribe, tribes } from "../db/schema";
import { and, eq, ilike } from "drizzle-orm";
import { db } from "../db";
import { P, match } from "ts-pattern";
import { DBError, NotFoundError, UnknownError } from "../types/errors";

type TribeService = {
  readById: (
    id: number,
  ) => Promise<Result<Tribe, NotFoundError | DBError | UnknownError>>;
  search: (args: {
    name?: string;
    season?: number;
    type?: Tribe["type"];
  }) => Promise<Result<Tribe[], DBError | UnknownError>>;
};

export const tribeService: TribeService = {
  readById: async (id) => {
    try {
      const tribesRes = await db
        .select()
        .from(tribes)
        .where(eq(tribes.id, id))
        .limit(1);

      return match(tribesRes.length)
        .with(0, () =>
          err({
            type: "NOT_FOUND",
            message: `Tribe with id ${id} was not found in the database`,
          } satisfies NotFoundError),
        )
        .otherwise(() => ok(tribesRes[0]));
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
      .with(
        { name: P.nullish, type: P.nullish, season: P.nullish },
        async () => {
          try {
            const tribesRes = await db.select().from(tribes);
            return ok(tribesRes);
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
      )
      .otherwise(async ({ name, season, type }) => {
        try {
          const tribesRes = await db
            .select()
            .from(tribes)
            .where(
              and(
                ...[
                  ...(name ? [ilike(tribes.name, `${name}%`)] : []),
                  ...(season ? [eq(tribes.tribeSeasonNumber, season)] : []),
                  ...(type ? [eq(tribes.type, type)] : []),
                ],
              ),
            );
          return ok(tribesRes);
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
      });
  },
};
