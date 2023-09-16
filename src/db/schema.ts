import {
  InferColumnsDataTypes,
  InferInsertModel,
  InferSelectModel,
} from "drizzle-orm";
import {
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";

export const castaways = pgTable("castaways", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  link: text("link"),
});

export type Castaway = InferSelectModel<typeof castaways>;
export type CastawayInsert = InferInsertModel<typeof castaways>;

export const seasons = pgTable("seasons", {
  seasonNumber: integer("season_number").primaryKey(),
  name: varchar("name", { length: 128 }),
  location: varchar("location", { length: 128 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  numEpisodes: integer("num_episodes"),
  numCastaways: integer("num_castaways"),
  numDays: integer("num_days"),
});

export type Season = InferSelectModel<typeof seasons>;
export type SeasonInsert = InferInsertModel<typeof seasons>;

export const seasonMembership = pgTable("season_membership", {
  id: serial("id").primaryKey(),
  castawayId: integer("castaway_id")
    .references(() => castaways.id)
    .notNull(),
  castawaySeasonNumber: integer("castaway_season_number")
    .references(() => seasons.seasonNumber)
    .notNull(),
});

export type SeasonMembership = InferSelectModel<typeof seasonMembership>;
export type SeasonMembershipInsert = InferInsertModel<typeof seasonMembership>;

export const tribeTypeEnum = pgEnum("tribe_tybe", [
  "starting",
  "merge",
  "swap",
  "other",
]);

export const tribes = pgTable("tribes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  type: tribeTypeEnum("type"),
  tribeSeasonNumber: integer("tribe_season_number")
    .references(() => seasons.seasonNumber)
    .notNull(),
});

export type Tribe = InferSelectModel<typeof tribes>;
export type TribeInsert = InferInsertModel<typeof tribes>;

export const tribeMembership = pgTable("tribe_membership", {
  id: serial("id").primaryKey(),
  castawayId: integer("castaway_id")
    .references(() => castaways.id)
    .notNull(),
  tribeId: integer("tribe_id")
    .references(() => tribes.id)
    .notNull(),
});

export type TribeMembership = InferSelectModel<typeof tribeMembership>;
export type TribeMembershipInsert = InferInsertModel<typeof tribeMembership>;
