import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { upsertUser, getUserByOpenId } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("circles.invitation", () => {
  let testUser: AuthenticatedUser;
  let testUser2: AuthenticatedUser;

  beforeAll(async () => {
    await upsertUser({
      openId: "test-user-inv-1",
      name: "Test User Inv 1",
      email: "testinv1@example.com",
      loginMethod: "test",
    });
    
    await upsertUser({
      openId: "test-user-inv-2",
      name: "Test User Inv 2",
      email: "testinv2@example.com",
      loginMethod: "test",
    });

    const user1 = await getUserByOpenId("test-user-inv-1");
    const user2 = await getUserByOpenId("test-user-inv-2");
    
    testUser = user1 as AuthenticatedUser;
    testUser2 = user2 as AuthenticatedUser;
  });

  it("should create a public circle", async () => {
    const ctx = createAuthContext(testUser);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.circles.create({
      name: "Public Test Circle",
      description: "A public circle for testing",
      isPublic: true,
    });

    expect(result.circleId).toBeDefined();
    expect(result.circleId).toBeGreaterThan(0);
  });

  it("should create a private circle with invitation code", async () => {
    const ctx = createAuthContext(testUser);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.circles.create({
      name: "Private Test Circle",
      description: "A private circle with invitation code",
      isPublic: false,
    });

    expect(result.circleId).toBeDefined();
    expect(result.circleId).toBeGreaterThan(0);
  });

  it("should list public circles", async () => {
    const ctx = createAuthContext(testUser);
    const caller = appRouter.createCaller(ctx);

    const publicCircles = await caller.circles.listPublic();

    expect(Array.isArray(publicCircles)).toBe(true);
    expect(publicCircles.length).toBeGreaterThanOrEqual(1);
  });
});
