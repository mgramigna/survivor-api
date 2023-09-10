import { Elysia, t } from "elysia";
import { db } from "./db";
import {
  Season,
  Tribe,
  castaways,
  seasonMembership,
  seasons,
} from "./db/schema";
import {
  ApiResponse,
  CastawayReadResponse,
  CastawaySearchResponse,
} from "./types";
import { castawaysService } from "./services/castaways";
import { seasonService } from "./services/season";
import { match } from "ts-pattern";
import { wrapApiResponse } from "./util";
import { tribeService } from "./services/tribes";

const app = new Elysia()
  .group("/castaways", (app) =>
    app
      .get(
        "/",
        async (ctx): Promise<ApiResponse<CastawaySearchResponse>> => {
          const res = await castawaysService.search(ctx.query);

          return wrapApiResponse(res, ctx.set);
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
        async (ctx): Promise<ApiResponse<CastawayReadResponse>> => {
          const castawayAndSeasons = await castawaysService.readById(
            ctx.params.id,
          );

          return wrapApiResponse(castawayAndSeasons, ctx.set);
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
        async (ctx): Promise<ApiResponse<Season[]>> => {
          const seasonsRes = await seasonService.search(ctx.query);

          return wrapApiResponse(seasonsRes, ctx.set);
        },
        {
          query: t.Object({
            name: t.Optional(t.String()),
          }),
        },
      )
      .get(
        "/:number",
        async (ctx): Promise<ApiResponse<Season>> => {
          const seasonsRes = await seasonService.readByNumber(
            ctx.params.number,
          );

          return wrapApiResponse(seasonsRes, ctx.set);
        },
        {
          params: t.Object({
            number: t.Numeric(),
          }),
        },
      ),
  )
  .group("/tribes", (app) =>
    app
      .get(
        "/:id",
        async (ctx): Promise<ApiResponse<Tribe>> => {
          const tribesRes = await tribeService.readById(ctx.params.id);

          return wrapApiResponse(tribesRes, ctx.set);
        },
        {
          params: t.Object({
            id: t.Numeric(),
          }),
        },
      )
      .get(
        "/",
        async (ctx): Promise<ApiResponse<Tribe[]>> => {
          const tribesRes = await tribeService.search(ctx.query);

          return wrapApiResponse(tribesRes, ctx.set);
        },
        {
          query: t.Object({
            name: t.Optional(t.String()),
            type: t.Optional(
              t.Union([
                t.Literal<Tribe["type"]>("merge"),
                t.Literal<Tribe["type"]>("starting"),
                t.Literal<Tribe["type"]>("swap"),
                t.Literal<Tribe["type"]>("other"),
              ]),
            ),
            season: t.Optional(t.Numeric()),
          }),
        },
      ),
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server!.hostname}:${app.server!.port}`,
);
