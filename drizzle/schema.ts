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


/**
 * File share links table - for sharing files with temporary links
 */
export const fileShareLinks = mysqlTable("file_share_links", {
  id: int("id").autoincrement().primaryKey(),
  fileId: int("fileId").notNull().references(() => files.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt"),
  downloadCount: int("downloadCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  fileIdx: index("file_idx").on(table.fileId),
  tokenIdx: index("token_idx").on(table.token),
  expiresIdx: index("expires_idx").on(table.expiresAt),
}));

export type FileShareLink = typeof fileShareLinks.$inferSelect;
export type InsertFileShareLink = typeof fileShareLinks.$inferInsert;

/**
 * Circle activity logs table - tracks actions within circles
 */
export const circleActivityLogs = mysqlTable("circle_activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  circleId: int("circleId").notNull().references(() => circles.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "set null" }),
  action: mysqlEnum("action", ["member_joined", "member_left", "member_removed", "file_uploaded", "file_deleted", "folder_created", "folder_deleted", "circle_updated"]).notNull(),
  targetId: int("targetId"),
  targetType: mysqlEnum("targetType", ["member", "file", "folder"]),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  circleIdx: index("circle_activity_idx").on(table.circleId),
  userIdx: index("user_activity_idx").on(table.userId),
  actionIdx: index("action_idx").on(table.action),
  createdIdx: index("created_activity_idx").on(table.createdAt),
}));

export type CircleActivityLog = typeof circleActivityLogs.$inferSelect;
export type InsertCircleActivityLog = typeof circleActivityLogs.$inferInsert;

/**
 * Circle categories/tags table - for organizing circles
 */
export const circleCategories = mysqlTable("circle_categories", {
  id: int("id").autoincrement().primaryKey(),
  circleId: int("circleId").notNull().references(() => circles.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  circleIdx: index("circle_category_idx").on(table.circleId),
  categoryIdx: index("category_idx").on(table.category),
}));

export type CircleCategory = typeof circleCategories.$inferSelect;
export type InsertCircleCategory = typeof circleCategories.$inferInsert;


/**
 * Announcements table - for admin to publish site-wide announcements
 */
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "set null" }),
  isPublished: tinyint("isPublished").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  createdByIdx: index("created_by_idx").on(table.createdBy),
  publishedIdx: index("published_idx").on(table.isPublished),
  publishedAtIdx: index("published_at_idx").on(table.publishedAt),
}));

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Admin permissions table - tracks admin privileges and actions
 */
export const adminLogs = mysqlTable("admin_logs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: mysqlEnum("action", ["user_disabled", "user_enabled", "user_deleted", "announcement_created", "announcement_published", "announcement_deleted", "system_setting_changed"]).notNull(),
  targetUserId: int("targetUserId").references(() => users.id, { onDelete: "set null" }),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  adminIdx: index("admin_idx").on(table.adminId),
  actionIdx: index("action_idx").on(table.action),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;

/**
 * Site statistics table - for tracking site metrics
 */
export const siteStats = mysqlTable("site_stats", {
  id: int("id").autoincrement().primaryKey(),
  totalUsers: int("totalUsers").default(0),
  totalCircles: int("totalCircles").default(0),
  totalFiles: bigint("totalFiles", { mode: "number" }).default(0),
  totalStorage: bigint("totalStorage", { mode: "number" }).default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteStat = typeof siteStats.$inferSelect;
export type InsertSiteStat = typeof siteStats.$inferInsert;
