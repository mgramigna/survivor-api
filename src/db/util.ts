import { match } from "ts-pattern";

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
