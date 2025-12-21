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

describe("circles.members", () => {
  it("allows user to join a circle", async () => {
    const user1 = await db.upsertUser({ openId: "test-user-members-1a", name: "Test User 1" });
    const user2 = await db.upsertUser({ openId: "test-user-members-1b", name: "Test User 2" });
    if (!user1 || !user2) throw new Error("Failed to create users");
    const ctx1 = createAuthContext(user1.id, user1.openId);
    const ctx2 = createAuthContext(user2.id, user2.openId);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const circleResult = await caller1.circles.create({
      name: "Public Circle",
    });

    const joinResult = await caller2.circles.join({
      circleId: circleResult.circleId,
    });

    expect(joinResult.success).toBe(true);

    const member = await db.getCircleMember(circleResult.circleId, user2.id);
    expect(member).toBeDefined();
    expect(member?.role).toBe("member");
  });

  it("prevents duplicate membership", async () => {
    const user1 = await db.upsertUser({ openId: "test-user-members-2a", name: "Test User 1" });
    const user2 = await db.upsertUser({ openId: "test-user-members-2b", name: "Test User 2" });
    if (!user1 || !user2) throw new Error("Failed to create users");
    const ctx1 = createAuthContext(user1.id, user1.openId);
    const ctx2 = createAuthContext(user2.id, user2.openId);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const circleResult = await caller1.circles.create({
      name: "Circle",
    });

    await caller2.circles.join({ circleId: circleResult.circleId });

    await expect(
      caller2.circles.join({ circleId: circleResult.circleId })
    ).rejects.toThrow("Already a member");
  });

  it("allows member to leave circle", async () => {
    const user1 = await db.upsertUser({ openId: "test-user-members-3a", name: "Test User 1" });
    const user2 = await db.upsertUser({ openId: "test-user-members-3b", name: "Test User 2" });
    if (!user1 || !user2) throw new Error("Failed to create users");
    const ctx1 = createAuthContext(user1.id, user1.openId);
    const ctx2 = createAuthContext(user2.id, user2.openId);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const circleResult = await caller1.circles.create({
      name: "Circle",
    });

    await caller2.circles.join({ circleId: circleResult.circleId });

    const leaveResult = await caller2.circles.leave({
      circleId: circleResult.circleId,
    });

    expect(leaveResult.success).toBe(true);

    const member = await db.getCircleMember(circleResult.circleId, user2.id);
    expect(member).toBeUndefined();
  });

  it("prevents owner from leaving", async () => {
    const user1 = await db.upsertUser({ openId: "test-user-members-4", name: "Test User 1" });
    if (!user1) throw new Error("Failed to create user");
    const ctx = createAuthContext(user1.id, user1.openId);
    const caller = appRouter.createCaller(ctx);

    const circleResult = await caller.circles.create({
      name: "Circle",
    });

    await expect(
      caller.circles.leave({ circleId: circleResult.circleId })
    ).rejects.toThrow("Owner cannot leave");
  });

  it("allows owner to remove members", async () => {
    const user1 = await db.upsertUser({ openId: "test-user-members-5a", name: "Test User 1" });
    const user2 = await db.upsertUser({ openId: "test-user-members-5b", name: "Test User 2" });
    if (!user1 || !user2) throw new Error("Failed to create users");
    const ctx1 = createAuthContext(user1.id, user1.openId);
    const ctx2 = createAuthContext(user2.id, user2.openId);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const circleResult = await caller1.circles.create({
      name: "Circle",
    });

    await caller2.circles.join({ circleId: circleResult.circleId });

    const removeResult = await caller1.circles.removeMember({
      circleId: circleResult.circleId,
      userId: user2.id,
    });

    expect(removeResult.success).toBe(true);

    const member = await db.getCircleMember(circleResult.circleId, user2.id);
    expect(member).toBeUndefined();
  });

  it("prevents non-owner from removing members", async () => {
    const user1 = await db.upsertUser({ openId: "test-user-members-6a", name: "Test User 1" });
    const user2 = await db.upsertUser({ openId: "test-user-members-6b", name: "Test User 2" });
    const user3 = await db.upsertUser({ openId: "test-user-members-6c", name: "Test User 3" });
    if (!user1 || !user2 || !user3) throw new Error("Failed to create users");
    const ctx1 = createAuthContext(user1.id, user1.openId);
    const ctx2 = createAuthContext(user2.id, user2.openId);
    const ctx3 = createAuthContext(user3.id, user3.openId);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);
    const caller3 = appRouter.createCaller(ctx3);

    const circleResult = await caller1.circles.create({
      name: "Circle",
    });

    await caller2.circles.join({ circleId: circleResult.circleId });
    await caller3.circles.join({ circleId: circleResult.circleId });

    await expect(
      caller2.circles.removeMember({
        circleId: circleResult.circleId,
        userId: user3.id,
      })
    ).rejects.toThrow("Only circle owner can remove members");
  });
});
