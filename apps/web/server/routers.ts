import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { storagePut } from "./storage";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const bangladeshAddress = z.object({
  district: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  marketplace: router({
    snapshot: publicProcedure.query(() => db.getMarketplaceSnapshot()),
  }),
  profile: router({
    save: protectedProcedure
      .input(z.object({
        displayName: z.string().min(2).max(120),
        bio: z.string().max(1200).optional(),
        address: bangladeshAddress.optional(),
        phoneNumber: z.string().max(32).optional(),
        accountType: z.enum(["sender", "traveler", "both"]),
      }))
      .mutation(({ ctx, input }) => db.upsertProfile({
        userId: ctx.user.id,
        displayName: input.displayName,
        bio: input.bio,
        district: input.address?.district,
        city: input.address?.city,
        phoneNumber: input.phoneNumber,
        accountType: input.accountType,
      })),
  }),
  uploads: router({
    image: protectedProcedure
      .input(z.object({
        fileName: z.string().min(1).max(120),
        contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        dataUrl: z.string().min(30).max(7_000_000),
      }))
      .mutation(async ({ ctx, input }) => {
        const base64 = input.dataUrl.split(",")[1];
        if (!base64) throw new Error("The selected image could not be processed.");
        const bytes = Buffer.from(base64, "base64");
        if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("Images must be 5 MB or smaller.");
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
        return storagePut(`users/${ctx.user.id}/uploads/${safeName}`, bytes, input.contentType);
      }),
  }),
  verification: router({
    submit: protectedProcedure
      .input(z.object({
        documentType: z.enum(["national_id", "passport", "student_id"]),
        documentKey: z.string().min(1).max(512),
        documentUrl: z.string().min(1).max(512),
        universityName: z.string().max(180).optional(),
        universityAddress: z.string().max(1200).optional(),
      }))
      .mutation(({ ctx, input }) => db.submitVerification({ userId: ctx.user.id, ...input })),
  }),
  requests: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(4).max(180),
        category: z.string().min(2).max(80),
        description: z.string().min(12).max(5000),
        productImageUrl: z.string().max(512).optional(),
        productImageKey: z.string().max(512).optional(),
        productLink: z.string().max(512).optional(),
        weightKg: z.string().regex(/^\d+(\.\d{1,2})?$/),
        sizeDescription: z.string().max(180).optional(),
        purchaseCountry: z.string().min(2).max(80),
        destination: bangladeshAddress,
        budgetBdt: z.string().regex(/^\d+(\.\d{1,2})?$/),
      }))
      .mutation(({ ctx, input }) => db.createSendRequest({
        senderId: ctx.user.id,
        slug: `req-${nanoid(10)}`,
        title: input.title,
        category: input.category,
        description: input.description,
        productImageUrl: input.productImageUrl,
        productImageKey: input.productImageKey,
        productLink: input.productLink,
        weightKg: input.weightKg,
        sizeDescription: input.sizeDescription,
        purchaseCountry: input.purchaseCountry,
        destinationDistrict: input.destination.district,
        destinationCity: input.destination.city,
        budgetBdt: input.budgetBdt,
      })),
  }),
  flights: router({
    create: protectedProcedure
      .input(z.object({
        originCountry: z.string().min(2).max(80),
        originCity: z.string().min(2).max(80),
        destination: bangladeshAddress,
        transportMode: z.enum(["flight", "train", "cargo"]),
        departureAt: z.date(),
        availableWeightKg: z.string().regex(/^\d+(\.\d{1,2})?$/),
        pricingMode: z.enum(["per_kg", "per_item"]),
        priceBdt: z.string().regex(/^\d+(\.\d{1,2})?$/),
        notes: z.string().max(3000).optional(),
      }))
      .mutation(({ ctx, input }) => db.createFlightListing({
        travelerId: ctx.user.id,
        slug: `flight-${nanoid(10)}`,
        originCountry: input.originCountry,
        originCity: input.originCity,
        destinationDistrict: input.destination.district,
        destinationCity: input.destination.city,
        transportMode: input.transportMode,
        departureAt: input.departureAt,
        availableWeightKg: input.availableWeightKg,
        pricingMode: input.pricingMode,
        priceBdt: input.priceBdt,
        notes: input.notes,
      })),
  }),
  offers: router({
    create: protectedProcedure
      .input(z.object({
        requestId: z.number().int().positive(),
        amountBdt: z.string().regex(/^\d+(\.\d{1,2})?$/),
        note: z.string().max(2000).optional(),
        estimatedDeliveryAt: z.date().optional(),
      }))
      .mutation(({ ctx, input }) => db.createOffer({ ...input, travelerId: ctx.user.id })),
  }),
  dashboard: router({
    summary: protectedProcedure.query(({ ctx }) => db.getDashboardSummary(ctx.user.id)),
  }),
  admin: router({
    overview: adminProcedure.query(() => db.getAdminSummary()),
    users: adminProcedure.query(() => db.getAdminUsers()),
    verifications: adminProcedure.query(() => db.getAdminVerificationQueue()),
    operations: adminProcedure.query(() => db.getAdminOperations()),
    reviewVerification: adminProcedure.input(z.object({ id: z.number().int().positive(), decision: z.enum(["approved", "rejected"]), note: z.string().max(1000).optional() }))
      .mutation(({ ctx, input }) => db.reviewVerification({ ...input, reviewerId: ctx.user.id })),
  }),
});

export type AppRouter = typeof appRouter;
