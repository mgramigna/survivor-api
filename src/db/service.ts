import { Result, err, ok } from "neverthrow";
import { Season, castaways, seasonMembership, seasons } from "./schema";
import { db } from ".";
import { and, eq, ilike } from "drizzle-orm";
import { P, match } from "ts-pattern";

export async function getCastawayWithSeasonsById(id: number): Promise<
  Result<
    {
      id: number;
      name: string;
      seasons: {
        number: number;
        name: string | null;
      }[];
    },
    "NOT_FOUND"
  >
> {
  const castawayAndSeasons = await db
    .select({
      id: castaways.id,
      name: castaways.name,
      seasonNumber: seasonMembership.castawaySeasonNumber,
      seasonName: seasons.name,
    })
    .from(castaways)
    .innerJoin(seasonMembership, eq(castaways.id, seasonMembership.castawayId))
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
}

export function joinCastawaysWithSeasons(
  input: {
    id: number;
    name: string;
    seasonNumber: number;
    seasonName: string | null;
  }[],
): {
  id: number;
  name: string;
  seasons: {
    number: number;
    name: string | null;
  }[];
}[] {
  const lookup: Map<
    number,
    { name: string; seasons: Map<number, string | null> }
  > = new Map();

  input.forEach((cas) => {
    match(lookup.has(cas.id))
      .with(true, () => {
        if (!lookup.get(cas.id)!.seasons.has(cas.seasonNumber)) {
          lookup.get(cas.id)!.seasons.set(cas.seasonNumber, cas.seasonName);
        }
      })
      .with(false, () => {
        const newMap: Map<number, string | null> = new Map();
        newMap.set(cas.seasonNumber, cas.seasonName);
        lookup.set(cas.id, {
          name: cas.name,
          seasons: newMap,
        });
      });
  });

  const res: {
    id: number;
    name: string;
    seasons: {
      number: number;
      name: string | null;
    }[];
  }[] = [];

  for (const [id, info] of lookup) {
    const entry: (typeof res)[number] = {
      id,
      name: info.name,
      seasons: [],
    };

    for (const [seasonNumber, seasonName] of info.seasons) {
      entry.seasons.push({
        number: seasonNumber,
        name: seasonName,
      });
    }

    res.push(entry);
  }

  return res;
}

export async function getAllCastawaysWithSeasons(): Promise<
  Result<
    {
      id: number;
      name: string;
      seasons: {
        number: number;
        name: string | null;
      }[];
    }[],
    never
  >
> {
  const castawaysAndSeasons = await db
    .select({
      id: castaways.id,
      name: castaways.name,
      seasonNumber: seasonMembership.castawaySeasonNumber,
      seasonName: seasons.name,
    })
    .from(castaways)
    .innerJoin(seasonMembership, eq(castaways.id, seasonMembership.castawayId))
    .innerJoin(
      seasons,
      eq(seasonMembership.castawaySeasonNumber, seasons.seasonNumber),
    );

  const res = joinCastawaysWithSeasons(castawaysAndSeasons);

  return ok(res);
}

export async function getCastawayWithSeasonsByName(name: string): Promise<
  Result<
    {
      id: number;
      name: string;
      seasons: {
        number: number;
        name: string | null;
      }[];
    }[],
    never
  >
> {
  const castawaysAndSeasons = await db
    .select({
      id: castaways.id,
      name: castaways.name,
      seasonNumber: seasonMembership.castawaySeasonNumber,
      seasonName: seasons.name,
    })
    .from(castaways)
    .where(ilike(castaways.name, `${name}%`))
    .innerJoin(seasonMembership, eq(castaways.id, seasonMembership.castawayId))
    .innerJoin(
      seasons,
      eq(seasonMembership.castawaySeasonNumber, seasons.seasonNumber),
    );

  const res = joinCastawaysWithSeasons(castawaysAndSeasons);

  return ok(res);
}

export async function getCastawayWithSeasonsBySeason(season: number): Promise<
  Result<
    {
      id: number;
      name: string;
      seasons: {
        number: number;
        name: string | null;
      }[];
    }[],
    never
  >
> {
  const castawaysAndSeasons = await db
    .select({
      id: castaways.id,
      name: castaways.name,
      seasonNumber: seasonMembership.castawaySeasonNumber,
      seasonName: seasons.name,
    })
    .from(castaways)
    .where(eq(seasonMembership.castawaySeasonNumber, season))
    .innerJoin(seasonMembership, eq(castaways.id, seasonMembership.castawayId))
    .innerJoin(
      seasons,
      eq(seasonMembership.castawaySeasonNumber, seasons.seasonNumber),
    );

  const res = joinCastawaysWithSeasons(castawaysAndSeasons);

  return ok(res);
}

export async function getCastawayWithSeasonsByNameAndSeason(
  name: string,
  season: number,
): Promise<
  Result<
    {
      id: number;
      name: string;
      seasons: {
        number: number;
        name: string | null;
      }[];
    }[],
    never
  >
> {
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
    .innerJoin(seasonMembership, eq(castaways.id, seasonMembership.castawayId))
    .innerJoin(
      seasons,
      eq(seasonMembership.castawaySeasonNumber, seasons.seasonNumber),
    );

  const res = joinCastawaysWithSeasons(castawaysAndSeasons);

  return ok(res);
}

export async function getAllSeasons(): Promise<Result<Season[], never>> {
  const seasonsRes = await db.select().from(seasons);
  return ok(seasonsRes);
}

export async function getSeasonsByName(
  name: string,
): Promise<Result<Season[], never>> {
  const seasonsRes = await db
    .select()
    .from(seasons)
    .where(ilike(seasons.name, `${name}%`));
  return ok(seasonsRes);
}

export async function getSeasonByNumber(
  seasonNumber: number,
): Promise<Result<Season, "NOT_FOUND">> {
  const seasonsRes = await db
    .select()
    .from(seasons)
    .where(eq(seasons.seasonNumber, seasonNumber))
    .limit(1);

  return match(seasonsRes.length)
    .with(0, () => err("NOT_FOUND" as const))
    .otherwise(() => ok(seasonsRes[0]));
}
