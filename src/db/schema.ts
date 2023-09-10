import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  date,
  integer,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";

export const castaways = pgTable("castaways", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
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
