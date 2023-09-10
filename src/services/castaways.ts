import { Result, err, ok } from "neverthrow";
import { castaways, seasonMembership, seasons } from "../db/schema";
import { and, eq, ilike } from "drizzle-orm";
import { P, match } from "ts-pattern";
import { db } from "../db";
import { joinCastawaysWithSeasons } from "../db/util";
import { DBError, NotFoundError, UnknownError } from "../types/errors";

export type CastawayWithSeasons = {
  id: number;
  name: string;
  seasons: { name: string | null; number: number }[];
};

type CastawaysService = {
  readById: (
    id: number,
  ) => Promise<
    Result<CastawayWithSeasons, NotFoundError | DBError | UnknownError>
  >;
  search: (args: {
    name?: string;
    season?: number;
  }) => Promise<Result<CastawayWithSeasons[], DBError | UnknownError>>;
};

export const castawaysService: CastawaysService = {
  readById: async (id) => {
    try {
      const castawayAndSeasons = await db
        .select({
          id: castaways.id,
          name: castaways.name,
          seasonNumber: seasonMembership.castawaySeasonNumber,
          seasonName: seasons.name,
        })
        .from(castaways)
        .innerJoin(
          seasonMembership,
          eq(castaways.id, seasonMembership.castawayId),
        )
        .innerJoin(
          seasons,
          eq(seasonMembership.castawaySeasonNumber, seasons.seasonNumber),
        )
        .where(eq(castaways.id, id));

      return match(castawayAndSeasons.length)
        .with(0, () =>
          err({
            type: "NOT_FOUND",
            message: `Castaway with id ${id} does not exist`,
          } satisfies NotFoundError),
        )
        .otherwise(() =>
          ok({
            id: castawayAndSeasons[0].id,
            name: castawayAndSeasons[0].name,
            seasons: castawayAndSeasons.map((cas) => ({
              number: cas.seasonNumber,
              name: cas.seasonName,
            })),
          }),
        );
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
  search: async ({ name, season }) => {
    try {
      const castawaysAndSeasons = await db
        .select({
          id: castaways.id,
          name: castaways.name,
          seasonNumber: seasonMembership.castawaySeasonNumber,
          seasonName: seasons.name,
        })
        .from(castaways)
        .where(
          and(
            ...[
              ...(name ? [ilike(castaways.name, `${name}%`)] : []),
              ...(season
                ? [eq(seasonMembership.castawaySeasonNumber, season)]
                : []),
            ],
          ),
        )
        .innerJoin(
          seasonMembership,
          eq(castaways.id, seasonMembership.castawayId),
        )
        .innerJoin(
          seasons,
          eq(seasonMembership.castawaySeasonNumber, seasons.seasonNumber),
        );

      const res = joinCastawaysWithSeasons(castawaysAndSeasons);

      return ok(res);
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
};
