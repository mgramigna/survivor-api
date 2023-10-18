import { CheerioAPI, load } from "cheerio";
import { db } from "../src/db";
import { castawaysService } from "../src/services/castaways";
import { castaways } from "../src/db/schema";
import { eq } from "drizzle-orm";

const CASTAWAY_WIKI_URLS = [
  "https://survivor.fandom.com/wiki/Category:Borneo_Contestants",
  "https://survivor.fandom.com/wiki/Category:The_Australian_Outback_Contestants",
  "https://survivor.fandom.com/wiki/Category:Africa_Contestants",
  "https://survivor.fandom.com/wiki/Category:Marquesas_Contestants",
  "https://survivor.fandom.com/wiki/Category:Thailand_Contestants",
  "https://survivor.fandom.com/wiki/Category:The_Amazon_Contestants",
  "https://survivor.fandom.com/wiki/Category:Pearl_Islands_Contestants",
  "https://survivor.fandom.com/wiki/Category:All-Stars_Contestants",
  "https://survivor.fandom.com/wiki/Category:Vanuatu_Contestants",
  "https://survivor.fandom.com/wiki/Category:Palau_Contestants",
  "https://survivor.fandom.com/wiki/Category:Guatemala_Contestants",
  "https://survivor.fandom.com/wiki/Category:Panama_Contestants",
  "https://survivor.fandom.com/wiki/Category:Cook_Islands_Contestants",
  "https://survivor.fandom.com/wiki/Category:Fiji_Contestants",
  "https://survivor.fandom.com/wiki/Category:China_Contestants",
  "https://survivor.fandom.com/wiki/Category:Micronesia_Contestants",
  "https://survivor.fandom.com/wiki/Category:Gabon_Contestants",
  "https://survivor.fandom.com/wiki/Category:Tocantins_Contestants",
  "https://survivor.fandom.com/wiki/Category:Samoa_Contestants",
  "https://survivor.fandom.com/wiki/Category:Heroes_vs._Villains_Contestants",
  "https://survivor.fandom.com/wiki/Category:Nicaragua_Contestants",
  "https://survivor.fandom.com/wiki/Category:Redemption_Island_Contestants",
  "https://survivor.fandom.com/wiki/Category:South_Pacific_Contestants",
  "https://survivor.fandom.com/wiki/Category:One_World_Contestants",
  "https://survivor.fandom.com/wiki/Category:Philippines_Contestants",
  "https://survivor.fandom.com/wiki/Category:Caramoan_Contestants",
  "https://survivor.fandom.com/wiki/Category:Blood_vs._Water_Contestants",
  "https://survivor.fandom.com/wiki/Category:Cagayan_Contestants",
  "https://survivor.fandom.com/wiki/Category:San_Juan_del_Sur_Contestants",
  "https://survivor.fandom.com/wiki/Category:Worlds_Apart_Contestants",
  "https://survivor.fandom.com/wiki/Category:Ka%C3%B4h_R%C5%8Dng_Contestants",
  "https://survivor.fandom.com/wiki/Category:Cambodia_Contestants",
  "https://survivor.fandom.com/wiki/Category:Millennials_vs._Gen_X_Contestants",
  "https://survivor.fandom.com/wiki/Category:Game_Changers_Contestants",
  "https://survivor.fandom.com/wiki/Category:Heroes_vs._Healers_vs._Hustlers_Contestants",
  "https://survivor.fandom.com/wiki/Category:Ghost_Island_Contestants",
  "https://survivor.fandom.com/wiki/Category:David_vs._Goliath_Contestants",
  "https://survivor.fandom.com/wiki/Category:Edge_of_Extinction_Contestants",
  "https://survivor.fandom.com/wiki/Category:Island_of_the_Idols_Contestants",
  "https://survivor.fandom.com/wiki/Category:Winners_at_War_Contestants",
  "https://survivor.fandom.com/wiki/Category:Survivor_41_Contestants",
  "https://survivor.fandom.com/wiki/Category:Survivor_42_Contestants",
  "https://survivor.fandom.com/wiki/Category:Survivor_43_Contestants",
  "https://survivor.fandom.com/wiki/Category:Survivor_44_Contestants",
  "https://survivor.fandom.com/wiki/Category:Survivor_45_Contestants",
];

async function scrape(url: string, seasonNumber: number) {
  const response = await fetch(url);

  const html = await response.text();

  const $ = load(html);

  const images = $(".category-page__member-thumbnail")
    .toArray()
    .map((e) => ({
      src:
        $(e)
          .attr("src")
          ?.replace(/\/smart.*/g, "") ?? "",
      title: $(e).attr("alt"),
    }));

  const allCastawaysInSeason = (
    await castawaysService.search({
      season: seasonNumber,
    })
  ).unwrapOr([]);

  const idToImage: Map<number, string> = new Map();

  images.forEach((img) => {
    const matching = allCastawaysInSeason.find((c) => c.name === img.title);

    if (!matching) {
      console.log(`Skipping ${img.title}. Problem?`);
    } else {
      idToImage.set(matching.id, img.src);
    }
  });

  return idToImage;
}

const final: Map<number, string> = new Map();

for (let i = 0; i < CASTAWAY_WIKI_URLS.length; i++) {
  const url = CASTAWAY_WIKI_URLS[i];
  console.log(`scraping ${url} (season ${i + 1})}`);
  const res = await scrape(url, i + 1);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  for (const [k, v] of res.entries()) {
    final.set(k, v);
  }
}

for (const [k, v] of final.entries()) {
  await db.update(castaways).set({ image: v }).where(eq(castaways.id, k));
}
