import { createSelection } from "bun-promptx";
import { db } from "../src/db";
import {
  castaways,
  seasonMembership,
  seasons,
  tribeMembership,
  tribes,
} from "../src/db/schema";

const result = createSelection(
  [
    { text: "no", description: "Abort database wipe" },
    { text: "yes", description: "Wipe the database" },
  ],
  {
    headerText:
      "Are you sure you want to wipe the database of all information?",
    footerText: "This action cannot be undone. Use sparingly",
  },
);

if (result.selectedIndex === 1) {
  await db.delete(tribeMembership),
    await db.delete(seasonMembership),
    await db.delete(tribeMembership),
    await db.delete(tribes),
    await db.delete(seasons),
    await db.delete(castaways),
    console.log("done");
}
