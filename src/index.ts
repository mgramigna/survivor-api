import { Elysia, t } from "elysia";
import { db } from "./db";
import { Season, castaways, seasonMembership, seasons } from "./db/schema";
import {
  ApiResponse,
  CastawayReadResponse,
  CastawaySearchResponse,
} from "./types";
import { castawaysService } from "./services/castaways";
import { seasonService } from "./services/season";
import { match } from "ts-pattern";

const app = new Elysia()
  .group("/castaways", (app) =>
    app
      .get(
        "/",
        async (ctx): ApiResponse<CastawaySearchResponse> => {
          const res = await castawaysService.search(ctx.query);

          if (res.isOk()) {
            return {
              ok: true as const,
              data: res.value,
            };
          } else {
            ctx.set.status = 500;
            return {
              ok: false as const,
              error: {
                message: res.error.message,
                type: res.error.type,
              },
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
          const castawayAndSeasons = await castawaysService.readById(
            ctx.params.id,
          );

          if (castawayAndSeasons.isOk()) {
            return {
              ok: true as const,
              data: castawayAndSeasons.value,
            };
          } else {
            return match(castawayAndSeasons.error)
              .with({ type: "NOT_FOUND" }, ({ message, type }) => {
                ctx.set.status = 404;
                return {
                  ok: false as const,
                  error: {
                    message,
                    type,
                  },
                };
              })
              .otherwise(({ message, type }) => {
                ctx.set.status = 500;
                return {
                  ok: false as const,
                  error: {
                    message,
                    type,
                  },
                };
              });
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
          const seasonsRes = await seasonService.search(ctx.query);

          if (seasonsRes.isOk()) {
            return {
              ok: true as const,
              data: seasonsRes.value,
            };
          } else {
            ctx.set.status = 500;
            return {
              ok: false as const,
              error: {
                message: seasonsRes.error.message,
                type: seasonsRes.error.type,
              },
            };
          }
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
          const seasonsRes = await seasonService.readByNumber(
            ctx.params.number,
          );

          if (seasonsRes.isOk()) {
            return {
              ok: true as const,
              data: seasonsRes.value,
            };
          } else {
            return match(seasonsRes.error)
              .with({ type: "NOT_FOUND" }, ({ message, type }) => {
                ctx.set.status = 404;
                return {
                  ok: false as const,
                  error: {
                    message,
                    type,
                  },
                };
              })
              .otherwise(({ message, type }) => {
                ctx.set.status = 500;
                return {
                  ok: false as const,
                  error: {
                    message,
                    type,
                  },
                };
              });
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
