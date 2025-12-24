import { eq, and, desc, sql } from "drizzle-orm";
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
