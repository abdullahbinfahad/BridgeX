import {
  boolean,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  displayName: varchar("displayName", { length: 120 }).notNull(),
  bio: text("bio"),
  avatarUrl: varchar("avatarUrl", { length: 512 }),
  district: varchar("district", { length: 80 }),
  city: varchar("city", { length: 80 }),
  phoneNumber: varchar("phoneNumber", { length: 32 }),
  accountType: mysqlEnum("accountType", ["sender", "traveler", "both"]).default("both").notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["unverified", "pending", "verified", "rejected"])
    .default("unverified")
    .notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  phoneVerified: boolean("phoneVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("profiles_user_unique").on(table.userId)]);

export const verifications = mysqlTable("verifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  documentType: mysqlEnum("documentType", ["national_id", "passport", "student_id"]).notNull(),
  documentKey: varchar("documentKey", { length: 512 }).notNull(),
  documentUrl: varchar("documentUrl", { length: 512 }).notNull(),
  universityName: varchar("universityName", { length: 180 }),
  universityAddress: text("universityAddress"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewerId: int("reviewerId"),
  reviewerNote: text("reviewerNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
}, table => [index("verification_user_status_idx").on(table.userId, table.status)]);

export const sendRequests = mysqlTable("sendRequests", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 180 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  description: text("description").notNull(),
  productImageKey: varchar("productImageKey", { length: 512 }),
  productImageUrl: varchar("productImageUrl", { length: 512 }),
  productLink: varchar("productLink", { length: 512 }),
  weightKg: decimal("weightKg", { precision: 7, scale: 2 }).notNull(),
  sizeDescription: varchar("sizeDescription", { length: 180 }),
  purchaseCountry: varchar("purchaseCountry", { length: 80 }).default("China").notNull(),
  destinationDistrict: varchar("destinationDistrict", { length: 80 }).notNull(),
  destinationCity: varchar("destinationCity", { length: 80 }).notNull(),
  budgetBdt: decimal("budgetBdt", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["open", "offered", "matched", "in_progress", "completed", "cancelled"])
    .default("open")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("request_status_created_idx").on(table.status, table.createdAt),
  index("request_destination_idx").on(table.destinationDistrict, table.destinationCity),
]);

export const flightListings = mysqlTable("flightListings", {
  id: int("id").autoincrement().primaryKey(),
  travelerId: int("travelerId").notNull(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  originCountry: varchar("originCountry", { length: 80 }).notNull(),
  originCity: varchar("originCity", { length: 80 }).notNull(),
  destinationCountry: varchar("destinationCountry", { length: 80 }).default("Bangladesh").notNull(),
  destinationDistrict: varchar("destinationDistrict", { length: 80 }).notNull(),
  destinationCity: varchar("destinationCity", { length: 80 }).notNull(),
  transportMode: mysqlEnum("transportMode", ["flight", "cargo"]).default("flight").notNull(),
  departureAt: timestamp("departureAt").notNull(),
  availableWeightKg: decimal("availableWeightKg", { precision: 7, scale: 2 }).notNull(),
  pricingMode: mysqlEnum("pricingMode", ["per_kg", "per_item"]).default("per_kg").notNull(),
  priceBdt: decimal("priceBdt", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["open", "partially_reserved", "fully_reserved", "cancelled", "completed"])
    .default("open")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("flight_status_departure_idx").on(table.status, table.departureAt),
  index("flight_route_idx").on(table.originCountry, table.destinationDistrict),
]);

export const offers = mysqlTable("offers", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  flightListingId: int("flightListingId"),
  travelerId: int("travelerId").notNull(),
  amountBdt: decimal("amountBdt", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  estimatedDeliveryAt: timestamp("estimatedDeliveryAt"),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "withdrawn"])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("offer_request_status_idx").on(table.requestId, table.status)]);

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 40 }).notNull().unique(),
  requestId: int("requestId").notNull(),
  offerId: int("offerId").notNull(),
  senderId: int("senderId").notNull(),
  travelerId: int("travelerId").notNull(),
  itemAmountBdt: decimal("itemAmountBdt", { precision: 12, scale: 2 }).notNull(),
  serviceFeeBdt: decimal("serviceFeeBdt", { precision: 12, scale: 2 }).notNull(),
  platformFeeBdt: decimal("platformFeeBdt", { precision: 12, scale: 2 }).notNull(),
  escrowAmountBdt: decimal("escrowAmountBdt", { precision: 12, scale: 2 }).notNull(),
  escrowStatus: mysqlEnum("escrowStatus", ["awaiting_deposit", "funded", "released", "refunded", "on_hold"])
    .default("awaiting_deposit")
    .notNull(),
  fulfillmentStatus: mysqlEnum("fulfillmentStatus", ["offer_accepted", "purchase_pending", "purchased", "in_transit", "delivered", "completed", "disputed", "cancelled"])
    .default("offer_accepted")
    .notNull(),
  deliveryConfirmedAt: timestamp("deliveryConfirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("order_sender_status_idx").on(table.senderId, table.fulfillmentStatus),
  index("order_traveler_status_idx").on(table.travelerId, table.fulfillmentStatus),
]);

export const walletTransactions = mysqlTable("walletTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderId: int("orderId"),
  type: mysqlEnum("type", ["escrow_deposit", "escrow_release", "refund", "platform_fee", "withdrawal"])
    .notNull(),
  direction: mysqlEnum("direction", ["credit", "debit"]).notNull(),
  amountBdt: decimal("amountBdt", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "reversed"]).default("pending").notNull(),
  reference: varchar("reference", { length: 80 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("wallet_user_created_idx").on(table.userId, table.createdAt)]);

export const orderMessages = mysqlTable("orderMessages", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  senderId: int("senderId").notNull(),
  body: text("body"),
  attachmentKey: varchar("attachmentKey", { length: 512 }),
  attachmentUrl: varchar("attachmentUrl", { length: 512 }),
  locationLabel: varchar("locationLabel", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("message_order_created_idx").on(table.orderId, table.createdAt)]);

export const savedListings = mysqlTable("savedListings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  listingType: mysqlEnum("listingType", ["request", "flight"]).notNull(),
  listingId: int("listingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("saved_listing_unique").on(table.userId, table.listingType, table.listingId)]);

export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull(),
  targetUserId: int("targetUserId"),
  targetType: mysqlEnum("targetType", ["profile", "request", "flight", "order", "message"]).notNull(),
  targetId: int("targetId").notNull(),
  reason: varchar("reason", { length: 160 }).notNull(),
  details: text("details"),
  status: mysqlEnum("status", ["open", "under_review", "resolved", "dismissed"]).default("open").notNull(),
  reviewerId: int("reviewerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, table => [index("report_status_created_idx").on(table.status, table.createdAt)]);

export const disputes = mysqlTable("disputes", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  openedById: int("openedById").notNull(),
  reason: varchar("reason", { length: 160 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["open", "under_review", "resolved_sender", "resolved_traveler", "cancelled"])
    .default("open")
    .notNull(),
  resolutionNote: text("resolutionNote"),
  resolvedById: int("resolvedById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, table => [index("dispute_order_status_idx").on(table.orderId, table.status)]);

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  authorId: int("authorId").notNull(),
  recipientId: int("recipientId").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("review_author_order_unique").on(table.orderId, table.authorId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type InsertProfile = typeof profiles.$inferInsert;
export type InsertSendRequest = typeof sendRequests.$inferInsert;
export type InsertFlightListing = typeof flightListings.$inferInsert;
