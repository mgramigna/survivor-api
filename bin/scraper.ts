import { CheerioAPI, load } from "cheerio";
import { P, match } from "ts-pattern";
import {
  CastawayInsert,
  SeasonInsert,
  SeasonMembershipInsert,
  TribeInsert,
  TribeMembershipInsert,
  castaways,
  seasonMembership,
  seasons,
  tribeMembership,
  tribes,
} from "../src/db/schema";
import { db } from "../src/db";
import { desc, eq } from "drizzle-orm";

const WIKI_BASE_URL = "https://survivor.fandom.com";

// Their names changed on the wiki between seasons
// Ensure these are merged together
const NAME_TRANSFORM = new Map([
  ["Kim Spradlin", "Kim Spradlin-Wolfe"],
  ["Amber Brkich", "Amber Mariano"],
]);
const SPECIAL_TRIBES = new Set(["The Outcasts"]);
const SEASON_WIKI_URLS = [
  "https://survivor.fandom.com/wiki/Survivor:_Borneo",
  "https://survivor.fandom.com/wiki/Survivor:_The_Australian_Outback",
  "https://survivor.fandom.com/wiki/Survivor:_Africa",
  "https://survivor.fandom.com/wiki/Survivor:_Marquesas",
  "https://survivor.fandom.com/wiki/Survivor:_Thailand",
  "https://survivor.fandom.com/wiki/Survivor:_The_Amazon",
  "https://survivor.fandom.com/wiki/Survivor:_Pearl_Islands",
  "https://survivor.fandom.com/wiki/Survivor:_All-Stars",
  "https://survivor.fandom.com/wiki/Survivor:_Vanuatu",
  "https://survivor.fandom.com/wiki/Survivor:_Palau",
  "https://survivor.fandom.com/wiki/Survivor:_Guatemala",
  "https://survivor.fandom.com/wiki/Survivor:_Panama",
  "https://survivor.fandom.com/wiki/Survivor:_Cook_Islands",
  "https://survivor.fandom.com/wiki/Survivor:_Fiji",
  "https://survivor.fandom.com/wiki/Survivor:_China",
  "https://survivor.fandom.com/wiki/Survivor:_Micronesia",
  "https://survivor.fandom.com/wiki/Survivor:_Gabon",
  "https://survivor.fandom.com/wiki/Survivor:_Tocantins",
  "https://survivor.fandom.com/wiki/Survivor:_Samoa",
  "https://survivor.fandom.com/wiki/Survivor:_Heroes_vs._Villains",
  "https://survivor.fandom.com/wiki/Survivor:_Nicaragua",
  "https://survivor.fandom.com/wiki/Survivor:_Redemption_Island",
  "https://survivor.fandom.com/wiki/Survivor:_South_Pacific",
  "https://survivor.fandom.com/wiki/Survivor:_One_World",
  "https://survivor.fandom.com/wiki/Survivor:_Philippines",
  "https://survivor.fandom.com/wiki/Survivor:_Caramoan",
  "https://survivor.fandom.com/wiki/Survivor:_Blood_vs._Water",
  "https://survivor.fandom.com/wiki/Survivor:_Cagayan",
  "https://survivor.fandom.com/wiki/Survivor:_San_Juan_del_Sur",
  "https://survivor.fandom.com/wiki/Survivor:_Worlds_Apart",
  "https://survivor.fandom.com/wiki/Survivor:_Ka%C3%B4h_R%C5%8Dng",
  "https://survivor.fandom.com/wiki/Survivor:_Cambodia",
  "https://survivor.fandom.com/wiki/Survivor:_Millennials_vs._Gen_X",
  "https://survivor.fandom.com/wiki/Survivor:_Game_Changers",
  "https://survivor.fandom.com/wiki/Survivor:_Heroes_vs._Healers_vs._Hustlers",
  "https://survivor.fandom.com/wiki/Survivor:_Ghost_Island",
  "https://survivor.fandom.com/wiki/Survivor:_David_vs._Goliath",
  "https://survivor.fandom.com/wiki/Survivor:_Edge_of_Extinction",
  "https://survivor.fandom.com/wiki/Survivor:_Island_of_the_Idols",
  "https://survivor.fandom.com/wiki/Survivor:_Winners_at_War",
  "https://survivor.fandom.com/wiki/Survivor_41",
  "https://survivor.fandom.com/wiki/Survivor_42",
  "https://survivor.fandom.com/wiki/Survivor_43",
  "https://survivor.fandom.com/wiki/Survivor_44",
  "https://survivor.fandom.com/wiki/Survivor_45",
];

function scrapeTribes(
  $: CheerioAPI,
  withMerge = true,
): {
  tribes: string[];
  mergeTribe?: string;
} {
  const tribes = $('div[data-source="tribes"] > .pi-data-value > a')
    .map((_, e) => $(e).text())
    .toArray();

  const mergeTribe = tribes[tribes.length - 1];

  return {
    tribes,
    mergeTribe: withMerge ? mergeTribe : undefined,
  };
}

function scrapeSeasonInfo($: CheerioAPI): {
  seasonNumber: number;
  location: string;
  startDate: string | null;
  endDate: string | null;
  name: string;
  numEpisodes: number;
  numCastaways: number;
  numDays: number;
} {
  const seasonNumber = parseInt(
    $('div[data-source="season"] > .pi-data-value').text(),
  );

  const seasonName = $('h2[data-source="title"]').text();

  const location = $('div[data-source="location"] > .pi-data-value').text();
  const [startStr, endStr] = $('div[data-source="seasonrun"] > .pi-data-value')
    .clone()
    .children()
    .remove()
    .end()
    .text()
    .replace(" - ", "-")
    .split("-") as [string | undefined, string | undefined];

  const numEpisodeText = $(
    'div[data-source="episodes"] > .pi-data-value',
  ).text();
  const numDaysText = $('div[data-source="days"] > .pi-data-value').text();
  const numCastawaysText = $(
    'div[data-source="survivors"] > .pi-data-value',
  ).text();

  const numEpisodes = numEpisodeText === "" ? 0 : parseInt(numEpisodeText);

  const numDays = numDaysText === "" ? 0 : parseInt(numDaysText);

  const numCastaways = numCastawaysText === "" ? 0 : parseInt(numCastawaysText);

  return {
    location,
    seasonNumber,
    name: seasonName,
    startDate: startStr ? new Date(startStr).toISOString() : null,
    endDate: endStr ? new Date(endStr).toISOString() : null,
    numCastaways,
    numEpisodes,
    numDays,
  };
}

function scrapeCastaways($: CheerioAPI): { name: string; link: string }[] {
  return $("#Castaways")
    .parent()
    .next()
    .find("b")
    .map((_, e) => {
      let castawayName = $(e).text();
      const castawayLink = $(e).find("a").attr("href");

      if (NAME_TRANSFORM.has(castawayName)) {
        castawayName = NAME_TRANSFORM.get(castawayName)!;
      }

      return {
        name: castawayName,
        link: castawayLink ? `${WIKI_BASE_URL}${castawayLink}` : "",
      };
    })
    .toArray()
    .filter((t) => t.name !== "Notes:" && !t.name.startsWith("^")); // Filter out any footnotes
}

function scrapeTribeMemberships(
  $: CheerioAPI,
  tribeSet: Set<string>,
  mergeTribeName?: string,
): Map<string, Set<string>> {
  const contestantsTable = $("#Castaways").parent().next();

  // Castaway name -> set of tribes
  const castawyTribeMap: Map<string, Set<string>> = new Map();

  let atMerge = false;
  $(contestantsTable)
    .find("tr")
    .slice(2) // Skip headers
    .each((_i, rowElem) => {
      let castawayName = $(rowElem).find("b").text();

      if (castawayName === "Notes:" || castawayName.startsWith("^")) {
        return;
      }

      if (NAME_TRANSFORM.has(castawayName)) {
        castawayName = NAME_TRANSFORM.get(castawayName)!;
      }

      const cells = $(rowElem).find("td");

      $(cells)
        .slice(2) // Skip image and name cells
        .each((j, td) => {
          const text = $(td).text().replace(/\n/g, "");

          if (tribeSet.has(text)) {
            if (text === mergeTribeName) {
              atMerge = true;
            }

            match(castawyTribeMap.has(castawayName))
              .with(true, () => {
                castawyTribeMap.get(castawayName)!.add(text);
              })
              .otherwise(() => {
                castawyTribeMap.set(castawayName, new Set([text]));
              });

            if (atMerge && mergeTribeName) {
              castawyTribeMap.get(castawayName)!.add(mergeTribeName);
            }
          }
        });
    });

  return castawyTribeMap;
}

// In-memory lookup of existing castaway name -> ID
// Used to identify duplicate castaways on seasons
const castawayLookup: Map<string, number> = new Map();

async function scrape(
  pageUrl: string,
  {
    startingCastawayId = 1,
    startingTribeId = 1,
    startingTribeMembershipId = 1,
    startingSeasonMembershipId = 1,
  }: {
    startingCastawayId?: number;
    startingTribeId?: number;
    startingTribeMembershipId?: number;
    startingSeasonMembershipId?: number;
  },
  withMerge = true,
  force = false,
): Promise<{
  numCastawayInserts: number;
  numTribeInserts: number;
  numTribeMembershipInserts: number;
  numSeasonMembershipInserts: number;
} | null> {
  const response = await fetch(pageUrl);

  const html = await response.text();

  const $ = load(html);

  const seasonInfo = scrapeSeasonInfo($);

  if (!force) {
    const [existingSeason] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.seasonNumber, seasonInfo.seasonNumber))
      .limit(1);

    if (existingSeason) {
      return null;
    }
  }

  const castawayInfo = scrapeCastaways($);
  const tribeInfo = scrapeTribes($, withMerge);
  const tribeMemberships = scrapeTribeMemberships(
    $,
    new Set(tribeInfo.tribes),
    tribeInfo.mergeTribe,
  );

  await db.insert(seasons).values(seasonInfo).onConflictDoNothing();

  const castawayInserts: CastawayInsert[] = castawayInfo.map((c, i) => {
    if (castawayLookup.has(c.name)) {
      return {
        id: castawayLookup.get(c.name)!,
        name: c.name,
        link: c.link,
      };
    }

    const newId = startingCastawayId + i;
    castawayLookup.set(c.name, newId);
    return {
      id: newId,
      name: c.name,
      link: c.link,
    };
  });

  const castawayInsertResults = await db
    .insert(castaways)
    .values(castawayInserts)
    .onConflictDoNothing()
    .returning();

  castawayInsertResults.forEach(({ id, name }) => {
    castawayLookup.set(name, id);
  });

  const seasonMembershipInserts: SeasonMembershipInsert[] = [];

  let seasonMembershipIdx = 0;
  for (const castaway of castawayInfo) {
    if (!castawayLookup.has(castaway.name)) {
      throw new Error("unreachable");
    }

    const castawayId = castawayLookup.get(castaway.name)!;
    seasonMembershipInserts.push({
      id: startingSeasonMembershipId + seasonMembershipIdx,
      castawayId,
      castawaySeasonNumber: seasonInfo.seasonNumber,
    });

    seasonMembershipIdx++;
  }

  if (seasonMembershipInserts.length > 0) {
    await db
      .insert(seasonMembership)
      .values(seasonMembershipInserts)
      .onConflictDoNothing();
  }

  const tribeInserts: TribeInsert[] = tribeInfo.tribes.map((t, i) => ({
    id: startingTribeId + i,
    name: t,
    type:
      t === tribeInfo.mergeTribe
        ? "merge"
        : SPECIAL_TRIBES.has(t)
        ? "other"
        : null,
    tribeSeasonNumber: seasonInfo.seasonNumber,
  }));

  const tribeInsertResults = await db
    .insert(tribes)
    .values(tribeInserts)
    .onConflictDoNothing()
    .returning();

  const tribeMembershipInserts: TribeMembershipInsert[] = [];

  let i = 0;
  for (const [castawayName, tribeSet] of tribeMemberships) {
    const castawayId = castawayLookup.get(castawayName)!;

    for (const t of tribeSet) {
      const matchingTribe = tribeInsertResults.find((ti) => ti.name === t);
      if (matchingTribe) {
        tribeMembershipInserts.push({
          id: startingTribeMembershipId + i,
          castawayId,
          tribeId: matchingTribe.id,
        });

        i++;
      }
    }
  }

  if (tribeMembershipInserts.length > 0) {
    await db
      .insert(tribeMembership)
      .values(tribeMembershipInserts)
      .onConflictDoNothing();
  }

  return {
    numCastawayInserts: castawayInserts.length,
    numTribeInserts: tribeInserts.length,
    numTribeMembershipInserts: tribeMembershipInserts.length,
    numSeasonMembershipInserts: seasonMembershipInserts.length,
  };
}

let startingCastawayId = 1;
let startingTribeId = 1;
let startingTribeMembershipId = 1;
let startingSeasonMembershipId = 1;
for (const url of SEASON_WIKI_URLS) {
  console.log(`scraping ${url}`);
  const res = await scrape(
    url,
    {
      startingCastawayId,
      startingTribeId,
      startingTribeMembershipId,
      startingSeasonMembershipId,
    },
    // Skip merge detection for 45 since it hasn't happened yet
    url !== "https://survivor.fandom.com/wiki/Survivor_45",
    Bun.env.FORCE === "true",
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (res != null) {
    startingCastawayId += res.numCastawayInserts;
    startingTribeId += res.numTribeInserts;
    startingTribeMembershipId += res.numTribeMembershipInserts;
    startingSeasonMembershipId += res.numSeasonMembershipInserts;
  } else {
    console.log(`skipping ${url}`);
  }
}

console.log("done");
