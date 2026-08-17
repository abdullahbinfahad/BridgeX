import { count, desc, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  flightListings,
  InsertFlightListing,
  InsertProfile,
  InsertSendRequest,
  InsertUser,
  offers,
  orders,
  profiles,
  reports,
  sendRequests,
  users,
  verifications,
  walletTransactions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getMarketplaceSnapshot() {
  const db = await getDb();
  if (!db) return { requests: [], flights: [] };
  const [requests, flights] = await Promise.all([
    db.select().from(sendRequests).orderBy(desc(sendRequests.createdAt)).limit(30),
    db.select().from(flightListings).orderBy(desc(flightListings.departureAt)).limit(30),
  ]);
  return { requests, flights };
}

export async function createSendRequest(values: InsertSendRequest) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace storage is not available.");
  await db.insert(sendRequests).values(values);
  const result = await db.select().from(sendRequests).where(eq(sendRequests.slug, values.slug)).limit(1);
  return result[0];
}

export async function createFlightListing(values: InsertFlightListing) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace storage is not available.");
  await db.insert(flightListings).values(values);
  const result = await db.select().from(flightListings).where(eq(flightListings.slug, values.slug)).limit(1);
  return result[0];
}

export async function createOffer(values: {
  requestId: number;
  travelerId: number;
  amountBdt: string;
  note?: string;
  estimatedDeliveryAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Offer storage is not available.");
  await db.insert(offers).values(values);
  const result = await db.select().from(offers).where(eq(offers.requestId, values.requestId)).orderBy(desc(offers.createdAt)).limit(1);
  return result[0];
}

export async function upsertProfile(values: InsertProfile) {
  const db = await getDb();
  if (!db) throw new Error("Profile storage is not available.");
  await db.insert(profiles).values(values).onDuplicateKeyUpdate({
    set: {
      displayName: values.displayName,
      bio: values.bio,
      district: values.district,
      city: values.city,
      phoneNumber: values.phoneNumber,
      accountType: values.accountType,
    },
  });
  const result = await db.select().from(profiles).where(eq(profiles.userId, values.userId)).limit(1);
  return result[0];
}

export async function submitVerification(values: {
  userId: number;
  documentType: "national_id" | "passport" | "student_id";
  documentKey: string;
  documentUrl: string;
  universityName?: string;
  universityAddress?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Verification storage is not available.");
  await db.insert(verifications).values(values);
  await db.update(profiles).set({ verificationStatus: "pending" }).where(eq(profiles.userId, values.userId));
  return { success: true } as const;
}

export async function getDashboardSummary(userId: number) {
  const db = await getDb();
  if (!db) return { requestCount: 0, flightCount: 0, activeOrderCount: 0, walletEntryCount: 0 };
  const [requestRow, flightRow, orderRow, walletRow] = await Promise.all([
    db.select({ total: count() }).from(sendRequests).where(eq(sendRequests.senderId, userId)),
    db.select({ total: count() }).from(flightListings).where(eq(flightListings.travelerId, userId)),
    db.select({ total: count() }).from(orders).where(or(eq(orders.senderId, userId), eq(orders.travelerId, userId))),
    db.select({ total: count() }).from(walletTransactions).where(eq(walletTransactions.userId, userId)),
  ]);
  return {
    requestCount: Number(requestRow[0]?.total ?? 0),
    flightCount: Number(flightRow[0]?.total ?? 0),
    activeOrderCount: Number(orderRow[0]?.total ?? 0),
    walletEntryCount: Number(walletRow[0]?.total ?? 0),
  };
}

export async function getAdminSummary() {
  const db = await getDb();
  if (!db) return { pendingVerifications: 0, activeOrders: 0, openReports: 0 };
  const [verificationRow, orderRow, reportRow] = await Promise.all([
    db.select({ total: count() }).from(verifications).where(eq(verifications.status, "pending")),
    db.select({ total: count() }).from(orders).where(eq(orders.fulfillmentStatus, "in_transit")),
    db.select({ total: count() }).from(reports).where(eq(reports.status, "open")),
  ]);
  return {
    pendingVerifications: Number(verificationRow[0]?.total ?? 0),
    activeOrders: Number(orderRow[0]?.total ?? 0),
    openReports: Number(reportRow[0]?.total ?? 0),
  };
}

export async function getAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn })
    .from(users).orderBy(desc(users.createdAt)).limit(100);
}

export async function getAdminVerificationQueue() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: verifications.id, userId: verifications.userId, documentType: verifications.documentType, status: verifications.status, createdAt: verifications.createdAt, name: users.name, email: users.email })
    .from(verifications).leftJoin(users, eq(verifications.userId, users.id)).orderBy(desc(verifications.createdAt)).limit(100);
}

export async function reviewVerification(values: { id: number; reviewerId: number; decision: "approved" | "rejected"; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Verification storage is not available.");
  const submission = await db.select().from(verifications).where(eq(verifications.id, values.id)).limit(1);
  const record = submission[0];
  if (!record) throw new Error("Verification submission was not found.");
  await db.update(verifications).set({ status: values.decision, reviewerId: values.reviewerId, reviewerNote: values.note, reviewedAt: new Date() }).where(eq(verifications.id, values.id));
  await db.update(profiles).set({ verificationStatus: values.decision === "approved" ? "verified" : "rejected" }).where(eq(profiles.userId, record.userId));
  return { success: true } as const;
}

export async function getAdminOperations() {
  const db = await getDb();
  if (!db) return { orders: [], reports: [] };
  const [adminOrders, adminReports] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.updatedAt)).limit(100),
    db.select().from(reports).orderBy(desc(reports.createdAt)).limit(100),
  ]);
  return { orders: adminOrders, reports: adminReports };
}
