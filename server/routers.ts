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
        isPublic: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        let invitationCode = null;
        if (!input.isPublic) {
          // Generate a unique 8-character invitation code
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          invitationCode = Array.from({ length: 8 }, () => 
            chars.charAt(Math.floor(Math.random() * chars.length))
          ).join('');
        }

        const circleId = await db.createCircle({
          name: input.name,
          description: input.description || null,
          creatorId: ctx.user.id,
          isPublic: input.isPublic ? 1 : 0,
          invitationCode,
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

    listPublic: publicProcedure.query(async () => {
      return await db.getPublicCircles();
    }),

    searchByInvitationCode: protectedProcedure
      .input(z.object({ code: z.string().min(1).max(64) }))
      .query(async ({ ctx, input }) => {
        const circle = await db.getCircleByInvitationCode(input.code);
        if (!circle) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invitation code" });
        }
        return circle;
      }),

    joinByInvitationCode: protectedProcedure
      .input(z.object({ code: z.string().min(1).max(64) }))
      .mutation(async ({ ctx, input }) => {
        const circle = await db.getCircleByInvitationCode(input.code);
        if (!circle) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invitation code" });
        }

        const existingMember = await db.getCircleMember(circle.id, ctx.user.id);
        if (existingMember) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Already a member of this circle" });
        }

        await db.addCircleMember({
          circleId: circle.id,
          userId: ctx.user.id,
          role: "member",
        });

        return { circleId: circle.id };
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
        folderId: z.number().optional(),
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
          folderId: input.folderId || null,
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

  folders: router({
    create: protectedProcedure
      .input(z.object({
        circleId: z.number(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getCircleMember(input.circleId, ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this circle" });
        }

        const folderId = await db.createFolder({
          circleId: input.circleId,
          name: input.name,
          description: input.description || null,
          createdBy: ctx.user.id,
        });

        return { folderId };
      }),

    list: protectedProcedure
      .input(z.object({ circleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const member = await db.getCircleMember(input.circleId, ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this circle" });
        }

        return await db.getFoldersByCircleId(input.circleId);
      }),

    rename: protectedProcedure
      .input(z.object({
        folderId: z.number(),
        name: z.string().min(1).max(255),
      }))
      .mutation(async ({ ctx, input }) => {
        const folder = await db.getFolderById(input.folderId);
        if (!folder) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Folder not found" });
        }

        const member = await db.getCircleMember(folder.circleId, ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this circle" });
        }

        await db.updateFolder(input.folderId, { name: input.name });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ folderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const folder = await db.getFolderById(input.folderId);
        if (!folder) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Folder not found" });
        }

        const member = await db.getCircleMember(folder.circleId, ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this circle" });
        }

        await db.deleteFolder(input.folderId);
        return { success: true };
      }),
  }),

  search: router({
    circles: publicProcedure
      .input(z.object({
        query: z.string().min(1),
      }))
      .query(async ({ input }) => {
        return await db.searchCirclesByName(input.query);
      }),
    
    byCategory: publicProcedure
      .input(z.object({
        category: z.string().min(1),
      }))
      .query(async ({ input }) => {
        return await db.searchCirclesByCategory(input.category);
      }),
  }),

  fileShare: router({
    createLink: protectedProcedure
      .input(z.object({
        fileId: z.number(),
        expiresAt: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const file = await db.getFileById(input.fileId);
        if (!file) {
          throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
        }

        const member = await db.getCircleMember(file.circleId, ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this circle" });
        }

        const token = nanoid(32);
        const linkId = await db.createFileShareLink({
          fileId: input.fileId,
          token,
          createdBy: ctx.user.id,
          expiresAt: input.expiresAt || null,
        });

        return { linkId, token };
      }),

    getByToken: publicProcedure
      .input(z.object({
        token: z.string(),
      }))
      .query(async ({ input }) => {
        const link = await db.getFileShareLinkByToken(input.token);
        if (!link) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Share link not found" });
        }

        if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Share link has expired" });
        }

        const file = await db.getFileById(link.fileId);
        return { file, link };
      }),

    deleteLink: protectedProcedure
      .input(z.object({
        linkId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteFileShareLink(input.linkId);
        return { success: true };
      }),
  }),

  activity: router({
    getCircleActivity: publicProcedure
      .input(z.object({
        circleId: z.number(),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        return await db.getActivityLogsByCircleId(input.circleId, input.limit);
      }),
  }),

  categories: router({
    add: protectedProcedure
      .input(z.object({
        circleId: z.number(),
        category: z.string().min(1).max(50),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getCircleMember(input.circleId, ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this circle" });
        }

        await db.addCircleCategory(input.circleId, input.category);
        return { success: true };
      }),

    getByCircle: publicProcedure
      .input(z.object({
        circleId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getCategoriesByCircleId(input.circleId);
      }),

    remove: protectedProcedure
      .input(z.object({
        circleId: z.number(),
        category: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const member = await db.getCircleMember(input.circleId, ctx.user.id);
        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this circle" });
        }

        await db.removeCircleCategory(input.circleId, input.category);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
