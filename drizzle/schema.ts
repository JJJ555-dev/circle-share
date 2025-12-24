import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, index, tinyint, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Circles table - represents file sharing groups
 */
export const circles = mysqlTable("circles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  creatorId: int("creatorId").notNull().references(() => users.id, { onDelete: "cascade" }),
  isPublic: tinyint("isPublic").default(1).notNull(),
  invitationCode: varchar("invitationCode", { length: 64 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  creatorIdx: index("creator_idx").on(table.creatorId),
  invitationCodeIdx: index("invitation_code_idx").on(table.invitationCode),
}));

export type Circle = typeof circles.$inferSelect;
export type InsertCircle = typeof circles.$inferInsert;

/**
 * Circle members table - tracks which users belong to which circles
 */
export const circleMembers = mysqlTable("circle_members", {
  id: int("id").autoincrement().primaryKey(),
  circleId: int("circleId").notNull().references(() => circles.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["owner", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => ({
  circleIdx: index("circle_idx").on(table.circleId),
  userIdx: index("user_idx").on(table.userId),
  uniqueMembership: index("unique_membership").on(table.circleId, table.userId),
}));

export type CircleMember = typeof circleMembers.$inferSelect;
export type InsertCircleMember = typeof circleMembers.$inferInsert;

/**
 * Folders table - represents folders within circles for organizing files
 */
export const folders = mysqlTable("folders", {
  id: int("id").autoincrement().primaryKey(),
  circleId: int("circleId").notNull().references(() => circles.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  circleIdx: index("folder_circle_idx").on(table.circleId),
  creatorIdx: index("folder_creator_idx").on(table.createdBy),
}));

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;

/**
 * Files table - stores metadata for uploaded files (actual files stored in S3)
 */
export const files = mysqlTable("files", {
  id: int("id").autoincrement().primaryKey(),
  circleId: int("circleId").notNull().references(() => circles.id, { onDelete: "cascade" }),
  folderId: int("folderId").references(() => folders.id, { onDelete: "set null" }),
  uploaderId: int("uploaderId").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: bigint("fileSize", { mode: "number" }).notNull(),
  fileType: mysqlEnum("fileType", ["video", "audio", "image"]).notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
}, (table) => ({
  circleIdx: index("circle_idx").on(table.circleId),
  folderIdx: index("folder_idx").on(table.folderId),
  uploaderIdx: index("uploader_idx").on(table.uploaderId),
  typeIdx: index("type_idx").on(table.fileType),
}));

export type File = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;
