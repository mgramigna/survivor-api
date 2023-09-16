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
import swagger from "@elysiajs/swagger";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Survivor API",
          version: "0.0.1",
        },
      },
    }),
  )
  .group("/castaways", (app) =>
    app
      .get(
        "/",
        async (ctx): Promise<ApiResponse<CastawaySearchResponse>> => {
          const res = await castawaysService.search({
            ...ctx.query,
            returning: ctx.query.returning === "true",
          });

          return wrapApiResponse(res, ctx.set);
        },
        {
          query: t.Object(
            {
              name: t.Optional(t.String()),
              season: t.Optional(t.Numeric()),
              returning: t.Optional(
                t.Union([t.Literal("true"), t.Literal("false")]),
              ),
            },
            {
              description: "Search for castaways by name or season",
            },
          ),
          detail: {
            summary: "Search for castaways",
            tags: ["castaways"],
          },
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
          params: t.Object(
            {
              id: t.Numeric(),
            },
            {
              description: "Read a specific castaway by id",
            },
          ),
          detail: {
            summary: "Get a specific castaway",
            tags: ["castaways"],
          },
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
          query: t.Object(
            {
              name: t.Optional(t.String()),
            },
            {
              description: "Filter by season name",
            },
          ),
          detail: {
            summary: "Search for seasons",
            tags: ["seasons"],
          },
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
          params: t.Object(
            {
              number: t.Numeric(),
            },
            {
              description: "Season number",
            },
          ),
          detail: {
            summary: "Find a specific season by number",
            tags: ["seasons"],
          },
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
          params: t.Object(
            {
              id: t.Numeric(),
            },
            {
              description: "Find specific tribe by id",
            },
          ),
          detail: {
            summary: "Find a specific tribe by id",
            tags: ["tribes"],
          },
        },
      )
      .get(
        "/",
        async (ctx): Promise<ApiResponse<Tribe[]>> => {
          const tribesRes = await tribeService.search(ctx.query);

          return wrapApiResponse(tribesRes, ctx.set);
        },
        {
          query: t.Object(
            {
              name: t.Optional(t.String()),
              type: t.Optional(
                t.Union([
                  t.Literal<NonNullable<Tribe["type"]>>("merge"),
                  t.Literal<NonNullable<Tribe["type"]>>("starting"),
                  t.Literal<NonNullable<Tribe["type"]>>("swap"),
                  t.Literal<NonNullable<Tribe["type"]>>("other"),
                ]),
              ),
              season: t.Optional(t.Numeric()),
            },
            {
              description: "By name, type or season",
            },
          ),
          detail: {
            summary: "Search for tribes",
            tags: ["tribes"],
          },
        },
      ),
  )
  .listen(Bun.env.PORT ?? 3000);

console.log(
  `🦊 Elysia is running at ${app.server!.hostname}:${app.server!.port}`,
);
