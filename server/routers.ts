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
  admin: router({
    getAnnouncements: protectedProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await db.getAnnouncements(input.limit, input.offset);
      }),
    createAnnouncement: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        await db.createAnnouncement({
          title: input.title,
          content: input.content,
          createdBy: ctx.user.id,
          isPublished: 0,
        });
        return { success: true };
      }),
    publishAnnouncement: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        await db.publishAnnouncement(input.id);
        await db.logAdminAction({
          adminId: ctx.user.id,
          action: "announcement_published",
          details: `Published announcement ${input.id}`,
        });
        return { success: true };
      }),
    deleteAnnouncement: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        await db.deleteAnnouncement(input.id);
        await db.logAdminAction({
          adminId: ctx.user.id,
          action: "announcement_deleted",
          details: `Deleted announcement ${input.id}`,
        });
        return { success: true };
      }),
    getAllUsers: protectedProcedure
      .input(z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await db.getAllUsers(input.limit, input.offset);
      }),
    disableUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        if (input.userId === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot disable yourself" });
        }
        await db.disableUser(input.userId);
        await db.logAdminAction({
          adminId: ctx.user.id,
          action: "user_disabled",
          targetUserId: input.userId,
        });
        return { success: true };
      }),
    getAdminLogs: protectedProcedure
      .input(z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
         return await db.getAdminLogs(input.limit, input.offset);
      }),
  }),
  payment: router({
    createOrder: protectedProcedure
      .input(z.object({
        fileId: z.number(),
        paymentMethod: z.enum(["wechat", "alipay"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const file = await db.getFileById(input.fileId);
        if (!file) {
          throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
        }
        
        if (!file.isPaid || !file.price) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This file is not for sale" });
        }

        // Check if buyer already owns this file
        const existingOrder = await db.getPaymentOrder(input.fileId);
        if (existingOrder && existingOrder.status === "completed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You already own this file" });
        }

        // Calculate fees: 0.1% platform fee
        const amount = parseFloat(file.price.toString());
        const platformFee = amount * 0.001; // 0.1%
        const sellerAmount = amount - platformFee;

        const orderId = await db.createPaymentOrder({
          fileId: input.fileId,
          buyerId: ctx.user.id,
          sellerId: file.uploaderId,
          amount: amount.toString() as any,
          platformFee: platformFee.toString() as any,
          sellerAmount: sellerAmount.toString() as any,
          paymentMethod: input.paymentMethod,
          status: "pending",
        });

        return { orderId, amount };
      }),

    getOrder: protectedProcedure
      .input(z.object({
        orderId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const order = await db.getPaymentOrder(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        // Only buyer or seller can view the order
        if (order.buyerId !== ctx.user.id && order.sellerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view this order" });
        }

        return order;
      }),

    completeOrder: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        transactionId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await db.getPaymentOrder(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        if (order.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Order is not pending" });
        }

        // Update order status
        await db.updatePaymentOrder(input.orderId, {
          status: "completed",
          transactionId: input.transactionId,
          completedAt: new Date(),
        });

        // Update seller earnings
        const sellerEarnings = await db.getUserEarnings(order.sellerId);
        const sellerAmountNum = typeof order.sellerAmount === 'string' ? parseFloat(order.sellerAmount) : order.sellerAmount;
        const newTotal = (typeof sellerEarnings?.totalEarnings === 'string' ? parseFloat(sellerEarnings.totalEarnings) : sellerEarnings?.totalEarnings || 0) + sellerAmountNum;
        const newAvailable = (typeof sellerEarnings?.availableAmount === 'string' ? parseFloat(sellerEarnings.availableAmount) : sellerEarnings?.availableAmount || 0) + sellerAmountNum;

        await db.createOrUpdateUserEarnings(order.sellerId, {
          totalEarnings: newTotal.toString() as any,
          availableAmount: newAvailable.toString() as any,
        });

        // Update platform earnings
        const month = new Date().toISOString().slice(0, 7); // YYYY-MM
        const platformEarnings = await db.getPlatformEarnings(month);
        const platformFeeNum = typeof order.platformFee === 'string' ? parseFloat(order.platformFee) : order.platformFee;
        const newPlatformTotal = (typeof platformEarnings?.totalEarnings === 'string' ? parseFloat(platformEarnings.totalEarnings) : platformEarnings?.totalEarnings || 0) + platformFeeNum;

        await db.createOrUpdatePlatformEarnings(month, {
          totalEarnings: newPlatformTotal.toString() as any,
          transactionCount: (platformEarnings?.transactionCount || 0) + 1,
        });

        return { success: true };
      }),

    getUserEarnings: protectedProcedure
      .query(async ({ ctx }) => {
        const earnings = await db.getUserEarnings(ctx.user.id);
        return earnings || {
          userId: ctx.user.id,
          totalEarnings: 0,
          withdrawnAmount: 0,
          availableAmount: 0,
        };
      }),

    getSellerOrders: protectedProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getSellerPaymentOrders(ctx.user.id, input.limit, input.offset);
      }),

    getBuyerOrders: protectedProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getUserPaymentOrders(ctx.user.id, input.limit, input.offset);
      }),
  }),

});
export type AppRouter = typeof appRouter;
