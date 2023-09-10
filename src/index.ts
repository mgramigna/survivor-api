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
          const castawayAndSeasons = await castawaysService.readById(
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
          const seasonsRes = await seasonService.search(ctx.query);

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
