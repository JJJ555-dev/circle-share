import { eq, desc, sql, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, circles, circleMembers, files, folders, InsertCircle, InsertCircleMember, InsertFile, User } from "../drizzle/schema";
import { ENV } from './_core/env';
let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<User | undefined> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
    
    return await getUserByOpenId(user.openId);
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Circle queries
export async function createCircle(data: InsertCircle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(circles).values(data);
  return result[0].insertId;
}

export async function getCircleById(circleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(circles).where(eq(circles.id, circleId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCirclesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: circles.id,
      name: circles.name,
      description: circles.description,
      creatorId: circles.creatorId,
      createdAt: circles.createdAt,
      updatedAt: circles.updatedAt,
      role: circleMembers.role,
      memberCount: sql<number>`(SELECT COUNT(*) FROM ${circleMembers} WHERE ${circleMembers.circleId} = ${circles.id})`,
    })
    .from(circleMembers)
    .innerJoin(circles, eq(circleMembers.circleId, circles.id))
    .where(eq(circleMembers.userId, userId))
    .orderBy(desc(circles.updatedAt));
  
  return result;
}

export async function updateCircle(circleId: number, data: Partial<InsertCircle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(circles).set(data).where(eq(circles.id, circleId));
}

export async function deleteCircle(circleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(circles).where(eq(circles.id, circleId));
}

// Circle member queries
export async function addCircleMember(data: InsertCircleMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(circleMembers).values(data);
  return result[0].insertId;
}

export async function getCircleMember(circleId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getCircleMembers(circleId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: circleMembers.id,
      circleId: circleMembers.circleId,
      userId: circleMembers.userId,
      role: circleMembers.role,
      joinedAt: circleMembers.joinedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(circleMembers)
    .innerJoin(users, eq(circleMembers.userId, users.id))
    .where(eq(circleMembers.circleId, circleId))
    .orderBy(desc(circleMembers.joinedAt));
  
  return result;
}

export async function removeCircleMember(circleId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(circleMembers).where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)));
}

// File queries
export async function createFile(data: InsertFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(files).values(data);
  return result[0].insertId;
}

export async function getFileById(fileId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFilesByCircleId(circleId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: files.id,
      circleId: files.circleId,
      folderId: files.folderId,
      uploaderId: files.uploaderId,
      filename: files.filename,
      fileKey: files.fileKey,
      fileUrl: files.fileUrl,
      mimeType: files.mimeType,
      fileSize: files.fileSize,
      fileType: files.fileType,
      uploadedAt: files.uploadedAt,
      uploaderName: users.name,
    })
    .from(files)
    .innerJoin(users, eq(files.uploaderId, users.id))
    .where(eq(files.circleId, circleId))
    .orderBy(desc(files.uploadedAt));
  
  return result;
}

export async function getFilesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: files.id,
      circleId: files.circleId,
      uploaderId: files.uploaderId,
      filename: files.filename,
      fileKey: files.fileKey,
      fileUrl: files.fileUrl,
      mimeType: files.mimeType,
      fileSize: files.fileSize,
      fileType: files.fileType,
      uploadedAt: files.uploadedAt,
      circleName: circles.name,
    })
    .from(files)
    .innerJoin(circles, eq(files.circleId, circles.id))
    .where(eq(files.uploaderId, userId))
    .orderBy(desc(files.uploadedAt));
  
  return result;
}

export async function deleteFile(fileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(files).where(eq(files.id, fileId));
}

// Folder functions
export async function createFolder(data: any): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(folders).values(data);
  return result[0].insertId;
}

export async function getFolderById(folderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFoldersByCircleId(circleId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: folders.id,
      circleId: folders.circleId,
      name: folders.name,
      description: folders.description,
      createdBy: folders.createdBy,
      createdAt: folders.createdAt,
      updatedAt: folders.updatedAt,
      creatorName: users.name,
    })
    .from(folders)
    .innerJoin(users, eq(folders.createdBy, users.id))
    .where(eq(folders.circleId, circleId))
    .orderBy(desc(folders.createdAt));
  
  return result;
}

export async function updateFolder(folderId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(folders).set(data).where(eq(folders.id, folderId));
}

export async function deleteFolder(folderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete all files in the folder first
  await db.update(files).set({ folderId: null }).where(eq(files.folderId, folderId));
  
  // Then delete the folder
  await db.delete(folders).where(eq(folders.id, folderId));
}

export async function getFilesByFolderId(folderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: files.id,
      circleId: files.circleId,
      folderId: files.folderId,
      uploaderId: files.uploaderId,
      filename: files.filename,
      fileKey: files.fileKey,
      fileUrl: files.fileUrl,
      mimeType: files.mimeType,
      fileSize: files.fileSize,
      fileType: files.fileType,
      uploadedAt: files.uploadedAt,
      uploaderName: users.name,
    })
    .from(files)
    .innerJoin(users, eq(files.uploaderId, users.id))
    .where(eq(files.folderId, folderId))
    .orderBy(desc(files.uploadedAt));
  
  return result;
}


export async function getPublicCircles() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: circles.id,
      name: circles.name,
      description: circles.description,
      creatorId: circles.creatorId,
      createdAt: circles.createdAt,
      updatedAt: circles.updatedAt,
      memberCount: sql<number>`(SELECT COUNT(*) FROM ${circleMembers} WHERE ${circleMembers.circleId} = ${circles.id})`,
    })
    .from(circles)
    .where(eq(circles.isPublic, 1))
    .orderBy(desc(circles.updatedAt));
  
  return result;
}

export async function getCircleByInvitationCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(circles)
    .where(eq(circles.invitationCode, code))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}


// File share links functions
export async function createFileShareLink(data: any): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { fileShareLinks } = await import("../drizzle/schema");
  const result = await db.insert(fileShareLinks).values(data);
  return result[0].insertId;
}

export async function getFileShareLinkByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { fileShareLinks } = await import("../drizzle/schema");
  const result = await db
    .select()
    .from(fileShareLinks)
    .where(eq(fileShareLinks.token, token))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getFileShareLinksByFileId(fileId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { fileShareLinks } = await import("../drizzle/schema");
  const result = await db
    .select()
    .from(fileShareLinks)
    .where(eq(fileShareLinks.fileId, fileId))
    .orderBy(desc(fileShareLinks.createdAt));
  
  return result;
}

export async function updateFileShareLinkDownloadCount(linkId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { fileShareLinks } = await import("../drizzle/schema");
  await db
    .update(fileShareLinks)
    .set({ downloadCount: sql`${fileShareLinks.downloadCount} + 1` })
    .where(eq(fileShareLinks.id, linkId));
}

export async function deleteFileShareLink(linkId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { fileShareLinks } = await import("../drizzle/schema");
  await db.delete(fileShareLinks).where(eq(fileShareLinks.id, linkId));
}

// Circle activity logs functions
export async function createActivityLog(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { circleActivityLogs } = await import("../drizzle/schema");
  await db.insert(circleActivityLogs).values(data);
}

export async function getActivityLogsByCircleId(circleId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const { circleActivityLogs } = await import("../drizzle/schema");
  const result = await db
    .select({
      id: circleActivityLogs.id,
      circleId: circleActivityLogs.circleId,
      userId: circleActivityLogs.userId,
      action: circleActivityLogs.action,
      targetId: circleActivityLogs.targetId,
      targetType: circleActivityLogs.targetType,
      description: circleActivityLogs.description,
      createdAt: circleActivityLogs.createdAt,
      userName: users.name,
    })
    .from(circleActivityLogs)
    .leftJoin(users, eq(circleActivityLogs.userId, users.id))
    .where(eq(circleActivityLogs.circleId, circleId))
    .orderBy(desc(circleActivityLogs.createdAt))
    .limit(limit);
  
  return result;
}

// Circle categories functions
export async function addCircleCategory(circleId: number, category: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { circleCategories } = await import("../drizzle/schema");
  await db.insert(circleCategories).values({ circleId, category });
}

export async function getCategoriesByCircleId(circleId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { circleCategories } = await import("../drizzle/schema");
  const result = await db
    .select({ category: circleCategories.category })
    .from(circleCategories)
    .where(eq(circleCategories.circleId, circleId));
  
  return result.map(r => r.category);
}

export async function removeCircleCategory(circleId: number, category: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { circleCategories } = await import("../drizzle/schema");
  await db
    .delete(circleCategories)
    .where(and(eq(circleCategories.circleId, circleId), eq(circleCategories.category, category)));
}

export async function searchCirclesByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  
  const { circleCategories } = await import("../drizzle/schema");
  const result = await db
    .select({
      id: circles.id,
      name: circles.name,
      description: circles.description,
      creatorId: circles.creatorId,
      createdAt: circles.createdAt,
      memberCount: sql<number>`(SELECT COUNT(*) FROM ${circleMembers} WHERE ${circleMembers.circleId} = ${circles.id})`,
    })
    .from(circleCategories)
    .innerJoin(circles, eq(circleCategories.circleId, circles.id))
    .where(and(eq(circleCategories.category, category), eq(circles.isPublic, 1)))
    .orderBy(desc(circles.updatedAt));
  
  return result;
}

export async function searchCirclesByName(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: circles.id,
      name: circles.name,
      description: circles.description,
      creatorId: circles.creatorId,
      createdAt: circles.createdAt,
      memberCount: sql<number>`(SELECT COUNT(*) FROM ${circleMembers} WHERE ${circleMembers.circleId} = ${circles.id})`,
    })
    .from(circles)
    .where(and(sql`${circles.name} LIKE ${`%${searchTerm}%`}`, eq(circles.isPublic, 1)))
    .orderBy(desc(circles.updatedAt));
  
  return result;
}
