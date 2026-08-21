CREATE TABLE `disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`openedById` int NOT NULL,
	`reason` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`status` enum('open','under_review','resolved_sender','resolved_traveler','cancelled') NOT NULL DEFAULT 'open',
	`resolutionNote` text,
	`resolvedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flightListings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`travelerId` int NOT NULL,
	`slug` varchar(80) NOT NULL,
	`originCountry` varchar(80) NOT NULL,
	`originCity` varchar(80) NOT NULL,
	`destinationCountry` varchar(80) NOT NULL DEFAULT 'Bangladesh',
	`destinationDistrict` varchar(80) NOT NULL,
	`destinationCity` varchar(80) NOT NULL,
		`transportMode` enum('flight','train','cargo') NOT NULL DEFAULT 'flight',
	`departureAt` timestamp NOT NULL,
	`availableWeightKg` decimal(7,2) NOT NULL,
	`pricingMode` enum('per_kg','per_item') NOT NULL DEFAULT 'per_kg',
	`priceBdt` decimal(12,2) NOT NULL,
	`notes` text,
	`status` enum('open','partially_reserved','fully_reserved','cancelled','completed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flightListings_id` PRIMARY KEY(`id`),
	CONSTRAINT `flightListings_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`flightListingId` int,
	`travelerId` int NOT NULL,
	`amountBdt` decimal(12,2) NOT NULL,
	`note` text,
	`estimatedDeliveryAt` timestamp,
	`status` enum('pending','accepted','rejected','withdrawn') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`senderId` int NOT NULL,
	`body` text,
	`attachmentKey` varchar(512),
	`attachmentUrl` varchar(512),
	`locationLabel` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(40) NOT NULL,
	`requestId` int NOT NULL,
	`offerId` int NOT NULL,
	`senderId` int NOT NULL,
	`travelerId` int NOT NULL,
	`itemAmountBdt` decimal(12,2) NOT NULL,
	`serviceFeeBdt` decimal(12,2) NOT NULL,
	`platformFeeBdt` decimal(12,2) NOT NULL,
	`escrowAmountBdt` decimal(12,2) NOT NULL,
	`escrowStatus` enum('awaiting_deposit','funded','released','refunded','on_hold') NOT NULL DEFAULT 'awaiting_deposit',
	`fulfillmentStatus` enum('offer_accepted','purchase_pending','purchased','in_transit','delivered','completed','disputed','cancelled') NOT NULL DEFAULT 'offer_accepted',
	`deliveryConfirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(120) NOT NULL,
	`bio` text,
	`avatarUrl` varchar(512),
	`district` varchar(80),
	`city` varchar(80),
	`phoneNumber` varchar(32),
	`accountType` enum('sender','traveler','both') NOT NULL DEFAULT 'both',
	`verificationStatus` enum('unverified','pending','verified','rejected') NOT NULL DEFAULT 'unverified',
	`emailVerified` boolean NOT NULL DEFAULT false,
	`phoneVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`targetUserId` int,
	`targetType` enum('profile','request','flight','order','message') NOT NULL,
	`targetId` int NOT NULL,
	`reason` varchar(160) NOT NULL,
	`details` text,
	`status` enum('open','under_review','resolved','dismissed') NOT NULL DEFAULT 'open',
	`reviewerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`authorId` int NOT NULL,
	`recipientId` int NOT NULL,
	`comment` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_author_order_unique` UNIQUE(`orderId`,`authorId`)
);
--> statement-breakpoint
CREATE TABLE `savedListings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`listingType` enum('request','flight') NOT NULL,
	`listingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedListings_id` PRIMARY KEY(`id`),
	CONSTRAINT `saved_listing_unique` UNIQUE(`userId`,`listingType`,`listingId`)
);
--> statement-breakpoint
CREATE TABLE `sendRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`slug` varchar(80) NOT NULL,
	`title` varchar(180) NOT NULL,
	`category` varchar(80) NOT NULL,
	`description` text NOT NULL,
	`productImageKey` varchar(512),
	`productImageUrl` varchar(512),
	`productLink` varchar(512),
	`weightKg` decimal(7,2) NOT NULL,
	`sizeDescription` varchar(180),
	`purchaseCountry` varchar(80) NOT NULL DEFAULT 'China',
	`destinationDistrict` varchar(80) NOT NULL,
	`destinationCity` varchar(80) NOT NULL,
	`budgetBdt` decimal(12,2) NOT NULL,
	`status` enum('open','offered','matched','in_progress','completed','cancelled') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sendRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `sendRequests_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentType` enum('national_id','passport','student_id') NOT NULL,
	`documentKey` varchar(512) NOT NULL,
	`documentUrl` varchar(512) NOT NULL,
	`universityName` varchar(180),
	`universityAddress` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewerId` int,
	`reviewerNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `walletTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orderId` int,
	`type` enum('escrow_deposit','escrow_release','refund','platform_fee','withdrawal') NOT NULL,
	`direction` enum('credit','debit') NOT NULL,
	`amountBdt` decimal(12,2) NOT NULL,
	`status` enum('pending','completed','failed','reversed') NOT NULL DEFAULT 'pending',
	`reference` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `walletTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `dispute_order_status_idx` ON `disputes` (`orderId`,`status`);--> statement-breakpoint
CREATE INDEX `flight_status_departure_idx` ON `flightListings` (`status`,`departureAt`);--> statement-breakpoint
CREATE INDEX `flight_route_idx` ON `flightListings` (`originCountry`,`destinationDistrict`);--> statement-breakpoint
CREATE INDEX `offer_request_status_idx` ON `offers` (`requestId`,`status`);--> statement-breakpoint
CREATE INDEX `message_order_created_idx` ON `orderMessages` (`orderId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `order_sender_status_idx` ON `orders` (`senderId`,`fulfillmentStatus`);--> statement-breakpoint
CREATE INDEX `order_traveler_status_idx` ON `orders` (`travelerId`,`fulfillmentStatus`);--> statement-breakpoint
CREATE INDEX `report_status_created_idx` ON `reports` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `request_status_created_idx` ON `sendRequests` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `request_destination_idx` ON `sendRequests` (`destinationDistrict`,`destinationCity`);--> statement-breakpoint
CREATE INDEX `verification_user_status_idx` ON `verifications` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `wallet_user_created_idx` ON `walletTransactions` (`userId`,`createdAt`);
