import { describe, expect, it, beforeEach } from "vitest";
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

describe("circles.create", () => {
  it("creates a circle and adds creator as owner", async () => {
    const user1 = await db.upsertUser({ openId: "test-user-1", name: "Test User 1" });
    if (!user1) throw new Error("Failed to create user");
    const ctx = createAuthContext(user1.id, user1.openId);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.circles.create({
      name: "Test Circle",
      description: "A test circle for unit testing",
    });

    expect(result).toHaveProperty("circleId");
    expect(typeof result.circleId).toBe("number");
    expect(result.circleId).toBeGreaterThan(0);

    const circle = await db.getCircleById(result.circleId);
    expect(circle).toBeDefined();
    expect(circle?.name).toBe("Test Circle");
    expect(circle?.description).toBe("A test circle for unit testing");
    expect(circle?.creatorId).toBe(user1.id);

    const member = await db.getCircleMember(result.circleId, user1.id);
    expect(member).toBeDefined();
    expect(member?.role).toBe("owner");
  });

  it("creates a circle without description", async () => {
    const user2 = await db.upsertUser({ openId: "test-user-2", name: "Test User 2" });
    if (!user2) throw new Error("Failed to create user");
    const ctx = createAuthContext(user2.id, user2.openId);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.circles.create({
      name: "Circle Without Description",
    });

    expect(result).toHaveProperty("circleId");
    const circle = await db.getCircleById(result.circleId);
    expect(circle).toBeDefined();
    expect(circle?.name).toBe("Circle Without Description");
    expect(circle?.description).toBeNull();
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.circles.create({
        name: "Unauthorized Circle",
      })
    ).rejects.toThrow();
  });
});
