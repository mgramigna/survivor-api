import { match } from "ts-pattern";
import { Castaway, Tribe } from "./schema";

export function joinTribeWithCastaways(
  input: {
    id: number;
    name: string;
    type: Tribe["type"];
    seasonNumber: number;
    castawayId: number;
    memberName: string;
  }[],
): (Tribe & { members: Castaway[] })[] {
  // Tribe id -> tribe info map
  const lookup: Map<
    number,
    {
      name: string;
      type: Tribe["type"];
      tribeSeasonNumber: number;
      memberLookup: Map<number, string>;
    }
  > = new Map();
  input.forEach((tribeAndCastaway) => {
    match(lookup.has(tribeAndCastaway.id))
      .with(true, () => {
        if (
          !lookup
            .get(tribeAndCastaway.id)!
            .memberLookup.has(tribeAndCastaway.castawayId)
        ) {
          lookup
            .get(tribeAndCastaway.id)!
            .memberLookup.set(
              tribeAndCastaway.castawayId,
              tribeAndCastaway.memberName,
            );
        }
      })
      .with(false, () => {
        const newMap: Map<number, string> = new Map();
        newMap.set(tribeAndCastaway.castawayId, tribeAndCastaway.memberName);
        lookup.set(tribeAndCastaway.id, {
          name: tribeAndCastaway.name,
          type: tribeAndCastaway.type,
          tribeSeasonNumber: tribeAndCastaway.seasonNumber,
          memberLookup: newMap,
        });
      });
  });

  const res: (Tribe & { members: Castaway[] })[] = [];

  for (const [id, info] of lookup) {
    const entry: (typeof res)[number] = {
      id,
      name: info.name,
      type: info.type,
      tribeSeasonNumber: info.tribeSeasonNumber,
      members: [],
    };

    for (const [castawayId, castawayName] of info.memberLookup) {
      entry.members.push({
        id: castawayId,
        name: castawayName,
      });
    }

    res.push(entry);
  }

  return res;
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
