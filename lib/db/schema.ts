import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import type { AdapterAccount } from "next-auth/adapters";

export const users = sqliteTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  password: text("password"), // Contraseña para analistas
  role: text("role").default("analyst"), // Role personalizado para RR-ONDA
});

export const accounts = sqliteTable(
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

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const investigations = sqliteTable("investigation", {
  id: text("id").notNull().primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  reportContent: text("report_content").notNull(), // El texto completo del expediente
  sourcesMetadata: text("sources_metadata"), // JSON string con las urls de imágenes y fuentes
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const transmediaPacks = sqliteTable("transmedia_pack", {
  id: text("id").notNull().primaryKey(),
  investigationId: text("investigation_id").references(() => investigations.id, { onDelete: "cascade" }),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  packContent: text("pack_content").notNull(), // El contenido generado para redes (Markdown)
  status: text("status").default("draft"), // draft, published
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const systemSettings = sqliteTable("system_setting", {
  key: text("key").notNull().primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
