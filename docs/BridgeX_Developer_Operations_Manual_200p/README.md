# BridgeX Developer Operations Manual — Build Source

This directory contains the reproducible source for the **200-page text-first BridgeX Developer Operations Manual**. The manual documents the current web application, independent native mobile application, Supabase data/security controls, platform operations, release engineering, scaling, migration, and incident response.

## Build

1. Run `python3 generate_text_manual.py` to create the final `main.typ` source.
2. Compile `main.typ` with Typst using the companion report theme.
3. Verify the resulting PDF’s page count, text, fonts, no-image result, and absence of prohibited attribution text.

Generated files, review renders, diagnostic logs, and the final PDF are intentionally not tracked because the source generator reproduces them and the approved PDF is retained in the secure handover Drive folder.

> The manual is intentionally text-first. It contains no graphs, charts, pictures, figure captions, logos, or external author attribution. It distinguishes implemented work, active work, and roadmap items; it must not be used to claim that every listed future feature is already in production.
