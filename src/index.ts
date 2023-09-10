import { Elysia, t } from "elysia";
import { db } from "./db";
import { castaways, seasonMembership, seasons } from "./db/schema";
import { eq, ilike, sql } from "drizzle-orm";
import { match, P } from "ts-pattern";

type ApiResponse<T> = Promise<
  { ok: false; error: string } | { ok: true; data: T }
>;

type CastawayReadResponse = {
  id: number;
  name: string;
  seasons: number[];
};

type CastawaySearchResponse = CastawayReadResponse[];

const app = new Elysia()
  .group("/castaways", (app) =>
    app
      .get(
        "/",
        async (ctx): ApiResponse<CastawaySearchResponse> => {
          const castawaysAndSeasons = await match(ctx.query)
            .with(
              {
                name: P.string,
              },
              ({ name }) =>
                db
                  .select({
                    id: castaways.id,
                    name: castaways.name,
                    season: seasonMembership.castawaySeasonNumber,
                  })
                  .from(castaways)
                  .where(ilike(castaways.name, `${name}%`))
                  .innerJoin(
                    seasonMembership,
                    eq(castaways.id, seasonMembership.castawayId),
                  ),
            )
            .otherwise(() =>
              db
                .select({
                  id: castaways.id,
                  name: castaways.name,
                  season: seasonMembership.castawaySeasonNumber,
                })
                .from(castaways)
                .innerJoin(
                  seasonMembership,
                  eq(castaways.id, seasonMembership.castawayId),
                ),
            );

          const lookup: Map<number, { name: string; seasons: number[] }> =
            new Map();

          castawaysAndSeasons.forEach((cas) => {
            if (lookup.has(cas.id)) {
              if (!lookup.get(cas.id)!.seasons.includes(cas.season)) {
                lookup.get(cas.id)!.seasons.push(cas.season);
              }
            } else {
              lookup.set(cas.id, {
                name: cas.name,
                seasons: [cas.season],
              });
            }
          });

          const res: CastawaySearchResponse = [];

          for (const [id, info] of lookup) {
            res.push({
              id,
              ...info,
            });
          }

          return {
            ok: true,
            data: res,
          };
        },
        {
          query: t.Object({
            name: t.Optional(t.String()),
          }),
        },
      )
      .get(
        "/:id",
        async (ctx): ApiResponse<CastawayReadResponse> => {
          const castawayAndSeasons = await db
            .select({
              id: castaways.id,
              name: castaways.name,
              season: seasonMembership.castawaySeasonNumber,
            })
            .from(castaways)
            .innerJoin(
              seasonMembership,
              eq(castaways.id, seasonMembership.castawayId),
            )
            .where(eq(castaways.id, ctx.params.id));

          return match(castawayAndSeasons.length)
            .with(0, () => ({
              ok: false as const,
              error: `Castaway with id "${ctx.params.id} not found`,
            }))
            .otherwise(() => ({
              ok: true,
              data: {
                id: castawayAndSeasons[0].id,
                name: castawayAndSeasons[0].name,
                seasons: castawayAndSeasons.map((cas) => cas.season),
              },
            }));
        },
        {
          params: t.Object({
            id: t.Numeric(),
          }),
        },
      ),
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server!.hostname}:${app.server!.port}`,
);
