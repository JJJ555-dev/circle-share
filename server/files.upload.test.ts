import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number, openId: string): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: openId,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("files.upload", () => {
  it("uploads an image file to a circle", async () => {
    const user1 = await db.upsertUser({ openId: "test-user-upload-1", name: "Test User 1" });
    if (!user1) throw new Error("Failed to create user");
    const ctx = createAuthContext(user1.id, user1.openId);
    const caller = appRouter.createCaller(ctx);

    const circleResult = await caller.circles.create({
      name: "Test Circle for Upload",
    });

    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const uploadResult = await caller.files.upload({
      circleId: circleResult.circleId,
      filename: "test-image.png",
      fileData: testImageBase64,
      mimeType: "image/png",
      fileSize: 95,
    });

    expect(uploadResult).toHaveProperty("fileId");
    expect(uploadResult).toHaveProperty("fileUrl");
    expect(typeof uploadResult.fileId).toBe("number");
    expect(typeof uploadResult.fileUrl).toBe("string");

    const file = await db.getFileById(uploadResult.fileId);
    expect(file).toBeDefined();
    expect(file?.filename).toBe("test-image.png");
    expect(file?.mimeType).toBe("image/png");
    expect(file?.fileType).toBe("image");
    expect(file?.uploaderId).toBe(user1.id);
  });

  it("rejects upload from non-member", async () => {
    const user1 = await db.upsertUser({ openId: "test-user-upload-2a", name: "Test User 1" });
    const user2 = await db.upsertUser({ openId: "test-user-upload-2b", name: "Test User 2" });
    if (!user1 || !user2) throw new Error("Failed to create users");
    const ctx1 = createAuthContext(user1.id, user1.openId);
    const ctx2 = createAuthContext(user2.id, user2.openId);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const circleResult = await caller1.circles.create({
      name: "Private Circle",
    });

    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    await expect(
      caller2.files.upload({
        circleId: circleResult.circleId,
        filename: "unauthorized.png",
        fileData: testImageBase64,
        mimeType: "image/png",
        fileSize: 95,
      })
    ).rejects.toThrow("Not a member of this circle");
  });

  it("rejects unsupported file types", async () => {
    const user1 = await db.upsertUser({ openId: "test-user-upload-3", name: "Test User 1" });
    if (!user1) throw new Error("Failed to create user");
    const ctx = createAuthContext(user1.id, user1.openId);
    const caller = appRouter.createCaller(ctx);

    const circleResult = await caller.circles.create({
      name: "Test Circle",
    });

    await expect(
      caller.files.upload({
        circleId: circleResult.circleId,
        filename: "document.pdf",
        fileData: "base64data",
        mimeType: "application/pdf",
        fileSize: 1000,
      })
    ).rejects.toThrow("Unsupported file type");
  });
});
