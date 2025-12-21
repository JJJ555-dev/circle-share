import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  circles: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const circleId = await db.createCircle({
          name: input.name,
          description: input.description || null,
          creatorId: ctx.user.id,
        });

        await db.addCircleMember({
          circleId,
          userId: ctx.user.id,
          role: "owner",
        });

        return { circleId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCirclesByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ circleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const circle = await db.getCircleById(input.circleId);
        if (!circle) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Circle not found" });
        }

        const member = await db.getCircleMember(input.circleId, ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not a member of this circle" });
        }

        const members = await db.getCircleMembers(input.circleId);
        const files = await db.getFilesByCircleId(input.circleId);

        return {
          ...circle,
          members,
          files,
          userRole: member.role,
        };
      }),

    update: protectedProcedure
      .input(z.object({
        circleId: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getCircleMember(input.circleId, ctx.user.id);
        if (!member || member.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only circle owner can update" });
        }

        const updateData: { name?: string; description?: string | null } = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description || null;

        await db.updateCircle(input.circleId, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ circleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getCircleMember(input.circleId, ctx.user.id);
        if (!member || member.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only circle owner can delete" });
        }

        await db.deleteCircle(input.circleId);
        return { success: true };
      }),

    addMember: protectedProcedure
      .input(z.object({
        circleId: z.number(),
        userEmail: z.string().email(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getCircleMember(input.circleId, ctx.user.id);
        if (!member || member.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only circle owner can add members" });
        }

        throw new TRPCError({ 
          code: "NOT_IMPLEMENTED", 
          message: "User lookup by email not yet implemented. Use join link instead." 
        });
      }),

    join: protectedProcedure
      .input(z.object({ circleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const circle = await db.getCircleById(input.circleId);
        if (!circle) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Circle not found" });
        }

        const existingMember = await db.getCircleMember(input.circleId, ctx.user.id);
        if (existingMember) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Already a member" });
        }

        await db.addCircleMember({
          circleId: input.circleId,
          userId: ctx.user.id,
          role: "member",
        });

        return { success: true };
      }),

    leave: protectedProcedure
      .input(z.object({ circleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getCircleMember(input.circleId, ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Not a member" });
        }

        if (member.role === "owner") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Owner cannot leave. Delete the circle instead." });
        }

        await db.removeCircleMember(input.circleId, ctx.user.id);
        return { success: true };
      }),

    removeMember: protectedProcedure
      .input(z.object({
        circleId: z.number(),
        userId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getCircleMember(input.circleId, ctx.user.id);
        if (!member || member.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only circle owner can remove members" });
        }

        const targetMember = await db.getCircleMember(input.circleId, input.userId);
        if (!targetMember) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
        }

        if (targetMember.role === "owner") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove owner" });
        }

        await db.removeCircleMember(input.circleId, input.userId);
        return { success: true };
      }),
  }),

  files: router({
    upload: protectedProcedure
      .input(z.object({
        circleId: z.number(),
        filename: z.string(),
        fileData: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getCircleMember(input.circleId, ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this circle" });
        }

        let fileType: "video" | "audio" | "image";
        if (input.mimeType.startsWith("video/")) {
          fileType = "video";
        } else if (input.mimeType.startsWith("audio/")) {
          fileType = "audio";
        } else if (input.mimeType.startsWith("image/")) {
          fileType = "image";
        } else {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported file type" });
        }

        const buffer = Buffer.from(input.fileData, "base64");
        const fileExt = input.filename.split(".").pop() || "bin";
        const fileKey = `circles/${input.circleId}/${ctx.user.id}-${nanoid()}.${fileExt}`;

        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        const fileId = await db.createFile({
          circleId: input.circleId,
          uploaderId: ctx.user.id,
          filename: input.filename,
          fileKey,
          fileUrl: url,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          fileType,
        });

        return { fileId, fileUrl: url };
      }),

    list: protectedProcedure
      .input(z.object({ circleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const member = await db.getCircleMember(input.circleId, ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this circle" });
        }

        return await db.getFilesByCircleId(input.circleId);
      }),

    delete: protectedProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const file = await db.getFileById(input.fileId);
        if (!file) {
          throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
        }

        const member = await db.getCircleMember(file.circleId, ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this circle" });
        }

        if (file.uploaderId !== ctx.user.id && member.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only uploader or circle owner can delete" });
        }

        await db.deleteFile(input.fileId);
        return { success: true };
      }),

    myUploads: protectedProcedure.query(async ({ ctx }) => {
      return await db.getFilesByUserId(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
