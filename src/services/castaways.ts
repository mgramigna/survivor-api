import { Result, err, ok } from "neverthrow";
import { castaways, seasonMembership, seasons } from "../db/schema";
import { and, eq, ilike } from "drizzle-orm";
import { P, match } from "ts-pattern";
import { db } from "../db";
import { joinCastawaysWithSeasons } from "../db/util";

export type CastawayWithSeasons = {
  id: number;
  name: string;
  seasons: { name: string | null; number: number }[];
};

type CastawaysService = {
  readById: (id: number) => Promise<Result<CastawayWithSeasons, "NOT_FOUND">>;
  search: (args: {
    name?: string;
    season?: number;
  }) => Promise<Result<CastawayWithSeasons[], never>>;
};

export const castawaysService: CastawaysService = {
  readById: async (id) => {
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
      .with(0, () => err("NOT_FOUND" as const))
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
  },
  search: async (args) => {
    return match(args)
      .with(
        {
          name: P.string,
          season: P.number,
        },
        async ({ name, season }) => {
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
                ilike(castaways.name, `${name}%`),
                eq(seasonMembership.castawaySeasonNumber, season),
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
        },
      )
      .with(
        {
          name: P.string,
        },
        async ({ name }) => {
          const castawaysAndSeasons = await db
            .select({
              id: castaways.id,
              name: castaways.name,
              seasonNumber: seasonMembership.castawaySeasonNumber,
              seasonName: seasons.name,
            })
            .from(castaways)
            .where(ilike(castaways.name, `${name}%`))
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
        },
      )
      .with(
        {
          season: P.number,
        },
        async ({ season }) => {
          const castawaysAndSeasons = await db
            .select({
              id: castaways.id,
              name: castaways.name,
              seasonNumber: seasonMembership.castawaySeasonNumber,
              seasonName: seasons.name,
            })
            .from(castaways)
            .where(eq(seasonMembership.castawaySeasonNumber, season))
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
        },
      )
      .otherwise(async () => {
        const castawaysAndSeasons = await db
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
          );

        const res = joinCastawaysWithSeasons(castawaysAndSeasons);

        return ok(res);
      });
  },
};
