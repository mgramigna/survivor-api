import {
  InferColumnsDataTypes,
  InferInsertModel,
  InferSelectModel,
} from "drizzle-orm";
import { int, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const castaways = sqliteTable("castaways", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name", { length: 64 }).notNull(),
  link: text("link"),
  image: text("image"),
});

export type Castaway = InferSelectModel<typeof castaways>;
export type CastawayInsert = InferInsertModel<typeof castaways>;

export const seasons = sqliteTable("seasons", {
  seasonNumber: integer("season_number").primaryKey(),
  name: text("name", { length: 128 }),
  location: text("location", { length: 128 }),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("start_date", { mode: "timestamp" }),
  numEpisodes: integer("num_episodes"),
  numCastaways: integer("num_castaways"),
  numDays: integer("num_days"),
});

export type Season = InferSelectModel<typeof seasons>;
export type SeasonInsert = InferInsertModel<typeof seasons>;

export const seasonMembership = sqliteTable("season_membership", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  castawayId: integer("castaway_id")
    .references(() => castaways.id)
    .notNull(),
  castawaySeasonNumber: integer("castaway_season_number")
    .references(() => seasons.seasonNumber)
    .notNull(),
});

export type SeasonMembership = InferSelectModel<typeof seasonMembership>;
export type SeasonMembershipInsert = InferInsertModel<typeof seasonMembership>;

export const tribes = sqliteTable("tribes", {
  id: integer("id").primaryKey(),
  name: text("name", { length: 64 }).notNull(),
  type: text("type", { enum: ["starting", "merge", "swap", "other"] }),
  tribeSeasonNumber: integer("tribe_season_number")
    .references(() => seasons.seasonNumber)
    .notNull(),
});

export type Tribe = InferSelectModel<typeof tribes>;
export type TribeInsert = InferInsertModel<typeof tribes>;

export const tribeMembership = sqliteTable("tribe_membership", {
  id: integer("id").primaryKey(),
  castawayId: integer("castaway_id")
    .references(() => castaways.id)
    .notNull(),
  tribeId: integer("tribe_id")
    .references(() => tribes.id)
    .notNull(),
});

export type TribeMembership = InferSelectModel<typeof tribeMembership>;
export type TribeMembershipInsert = InferInsertModel<typeof tribeMembership>;
