import { Elysia, t } from "elysia";
import { db } from "./db";
import { Season, castaways, seasonMembership, seasons } from "./db/schema";
import { match, P } from "ts-pattern";
import {
  ApiResponse,
  CastawayReadResponse,
  CastawaySearchResponse,
} from "./types";
import {
  getAllCastawaysWithSeasons,
  getAllSeasons,
  getCastawayWithSeasonsById,
  getCastawayWithSeasonsByName,
  getCastawayWithSeasonsByNameAndSeason,
  getCastawayWithSeasonsBySeason,
  getSeasonByNumber,
  getSeasonsByName,
} from "./db/service";

const app = new Elysia()
  .group("/castaways", (app) =>
    app
      .get(
        "/",
        async (ctx): ApiResponse<CastawaySearchResponse> => {
          console.log(ctx.query);
          const res = await match(ctx.query)
            .with(
              {
                name: P.string,
                season: P.number,
              },
              ({ name, season }) =>
                getCastawayWithSeasonsByNameAndSeason(name, season),
            )
            .with(
              {
                name: P.string,
              },
              ({ name }) => getCastawayWithSeasonsByName(name),
            )
            .with(
              {
                season: P.number,
              },
              ({ season }) => getCastawayWithSeasonsBySeason(season),
            )
            .otherwise(() => getAllCastawaysWithSeasons());

          if (res.isOk()) {
            return {
              ok: true as const,
              data: res.value,
            };
          } else {
            return {
              ok: false as const,
              error: res.error,
            };
          }
        },
        {
          query: t.Object({
            name: t.Optional(t.String()),
            season: t.Optional(t.Numeric()),
          }),
        },
      )
      .get(
        "/:id",
        async (ctx): ApiResponse<CastawayReadResponse> => {
          const castawayAndSeasons = await getCastawayWithSeasonsById(
            ctx.params.id,
          );

          if (castawayAndSeasons.isOk()) {
            return {
              ok: true as const,
              data: castawayAndSeasons.value,
            };
          } else {
            return {
              ok: false as const,
              error: castawayAndSeasons.error,
            };
          }
        },
        {
          params: t.Object({
            id: t.Numeric(),
          }),
        },
      ),
  )
  .group("/seasons", (app) =>
    app
      .get(
        "/",
        async (ctx): ApiResponse<Season[]> => {
          return match(ctx.query)
            .with({ name: P.string }, async ({ name }) => {
              const seasonsRes = await getSeasonsByName(name);

              if (seasonsRes.isOk()) {
                return {
                  ok: true as const,
                  data: seasonsRes.value,
                };
              } else {
                return {
                  ok: false as const,
                  error: seasonsRes.error,
                };
              }
            })
            .otherwise(async () => {
              const seasonsRes = await getAllSeasons();

              if (seasonsRes.isOk()) {
                return {
                  ok: true as const,
                  data: seasonsRes.value,
                };
              } else {
                return {
                  ok: false as const,
                  error: seasonsRes.error,
                };
              }
            });
        },
        {
          query: t.Object({
            name: t.Optional(t.String()),
          }),
        },
      )
      .get(
        "/:number",
        async (ctx): ApiResponse<Season> => {
          const seasonsRes = await getSeasonByNumber(ctx.params.number);

          if (seasonsRes.isOk()) {
            return {
              ok: true as const,
              data: seasonsRes.value,
            };
          } else {
            return {
              ok: false as const,
              error: seasonsRes.error,
            };
          }
        },
        {
          params: t.Object({
            number: t.Numeric(),
          }),
        },
      ),
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server!.hostname}:${app.server!.port}`,
);
