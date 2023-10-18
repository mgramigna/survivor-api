import { Result, err, ok } from "neverthrow";
import {
  Castaway,
  Season,
  Tribe,
  castaways,
  tribeMembership,
  tribes,
} from "../db/schema";
import { and, eq, ilike } from "drizzle-orm";
import { db } from "../db";
import { P, match } from "ts-pattern";
import { DBError, NotFoundError, UnknownError } from "../types/errors";
import { joinTribeWithCastaways } from "../db/util";

type TribeService = {
  readById: (
    id: number,
  ) => Promise<
    Result<
      Tribe & { members: Castaway[] },
      NotFoundError | DBError | UnknownError
    >
  >;
  search: (args: {
    name?: string;
    season?: number;
    type?: Tribe["type"];
  }) => Promise<
    Result<(Tribe & { members: Castaway[] })[], DBError | UnknownError>
  >;
};

export const tribeService: TribeService = {
  readById: async (id) => {
    try {
      const tribesRes = await db
        .select({
          id: tribes.id,
          name: tribes.name,
          type: tribes.type,
          seasonNumber: tribes.tribeSeasonNumber,
          castawayId: castaways.id,
          memberName: castaways.name,
          castawayLink: castaways.link,
          castawayImage: castaways.image,
        })
        .from(tribes)
        .where(eq(tribes.id, id))
        .innerJoin(tribeMembership, eq(tribeMembership.tribeId, tribes.id))
        .innerJoin(castaways, eq(tribeMembership.castawayId, castaways.id));

      return match(tribesRes.length)
        .with(0, () =>
          err({
            type: "NOT_FOUND",
            message: `Tribe with id ${id} was not found in the database`,
          } satisfies NotFoundError),
        )
        .otherwise(() =>
          ok({
            id: tribesRes[0].id,
            name: tribesRes[0].name,
            tribeSeasonNumber: tribesRes[0].seasonNumber,
            type: tribesRes[0].type,
            members: tribesRes.map((tr) => ({
              id: tr.castawayId,
              name: tr.memberName,
              link: tr.castawayLink,
              image: tr.castawayImage,
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
  search: async ({ name, season, type }) => {
    try {
      const tribesRes = await db
        .select({
          id: tribes.id,
          name: tribes.name,
          type: tribes.type,
          seasonNumber: tribes.tribeSeasonNumber,
          castawayId: castaways.id,
          memberName: castaways.name,
        })
        .from(tribes)
        .where(
          and(
            ...[
              ...(name ? [ilike(tribes.name, `${name}%`)] : []),
              ...(season ? [eq(tribes.tribeSeasonNumber, season)] : []),
              ...(type ? [eq(tribes.type, type)] : []),
            ],
          ),
        )
        .innerJoin(tribeMembership, eq(tribeMembership.tribeId, tribes.id))
        .innerJoin(castaways, eq(tribeMembership.castawayId, castaways.id));

      const res = joinTribeWithCastaways(tribesRes);

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
