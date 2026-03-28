import {
  pgTable,
  text,
  integer,
  timestamp,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"), 
  role: text("role").default("analyst"), 
  lastLoginAt: timestamp("last_login_at", { mode: "date" }),
  lastActivityAt: timestamp("last_activity_at", { mode: "date" }),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const investigations = pgTable("investigation", {
  id: text("id").notNull().primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  reportContent: text("report_content").notNull(), 
  sourcesMetadata: text("sources_metadata"), 
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const transmediaPacks = pgTable("transmedia_pack", {
  id: text("id").notNull().primaryKey(),
  investigationId: text("investigation_id").references(() => investigations.id, { onDelete: "cascade" }),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  packContent: text("pack_content").notNull(), 
  status: text("status").default("draft"), 
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const systemSettings = pgTable("system_setting", {
  key: text("key").notNull().primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

