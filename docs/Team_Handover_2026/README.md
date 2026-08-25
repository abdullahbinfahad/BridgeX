# BridgeX Team Handover Package — 2026

This package is the operating handover for BridgeX. It is written for a future founder, product manager, part-time developer, administrator, or acquiring company that needs to understand the platform without relying on the original AI session.

| Document | Purpose | Primary reader |
|---|---|---|
| `00_EXECUTIVE_PLAN_REVIEW.md` | Competition-plan assessment, strengths, gaps, and improvement actions | Founder, project lead, competition team |
| `01_TEAM_TASK_SHEET.md` | Role-by-role work queue, acceptance tests, and release routine | Part-time developers and operations team |
| `02_TECHNICAL_OPERATIONS_MANUAL.md` | Architecture, environments, security, deployments, administration, and incident response | Technical lead and administrators |
| `03_SCALING_AND_MIGRATION_RUNBOOK.md` | Growth stages, performance, backup, Render/Supabase migration, and data portability | Founder, engineering lead, acquirer |
| `04_TRANSFER_PACKAGE_MANIFEST.md` | What a secure sale-ready transfer must include and exclude | Buyer, legal/operations lead |

## Non-negotiable security rule

> Source code and configuration templates can be transferred. **Live credentials, user documents, passwords, API keys, payment records, private messages, Supabase service-role keys, Expo tokens, and signing keys must never be put in a public archive or ordinary shared Drive folder.** Transfer those only through a controlled credential handover after a buyer or new administrator is authorized.

The current repository contains a responsive web app, an independent Expo/React Native app, platform variants, a Supabase migration history, and deployment configuration. This package describes the present architecture as an operational baseline; it does not claim that every roadmap item is already shipped.

## Immediate team actions

1. Read the plan review and agree on the smallest lawful pilot: one community, defined routes, only legal item categories, and a measured user-research period.
2. Run the pre-release checks in the task sheet before every deployment.
3. Maintain a private credential register outside Git and Drive archives.
4. Export and verify database and Storage backups on a regular schedule appropriate to live activity.
5. Do not market payment-proof workflow as escrow, insurance, a wallet, or regulated payment custody unless the platform integrates a qualified provider and obtains the required approvals.
