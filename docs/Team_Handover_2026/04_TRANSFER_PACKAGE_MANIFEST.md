# BridgeX Sale-Ready Transfer Package Manifest

## Purpose

This manifest defines a secure project transfer. It is designed for a company acquisition, a new technical team, or a founder handover. It intentionally separates reproducible project assets from sensitive production access.

## Included in the sanitized archive

| Included asset | Why it is included |
|---|---|
| Git-tracked source code | Reproducible web, mobile, backend migration, and platform code |
| Supabase migration history | Schema and business-rule evolution |
| Deployment configuration | Render and EAS configuration without secrets |
| Documentation and handover manuals | Operational continuity |
| `.env.example` or secret-variable inventory without values | Lets an authorized team rebuild configuration safely |
| Release notes and build instructions | Supports Android, Play bundle, and iOS build continuity |
| File checksums/manifest | Lets the recipient verify archive integrity |

## Explicitly excluded

| Excluded asset | Reason |
|---|---|
| `.env` files and tokens | Credentials must never be embedded in a general archive |
| Supabase service-role keys or database passwords | Would expose all backend data |
| Expo tokens, Android keystores, Apple certificates, signing profiles | Release identity and account security |
| Real user tables, documents, payment proofs, reports, messages, Storage files | Private/personal data needs a controlled authorized export |
| Node modules, build caches, generated distribution outputs | Rebuildable and unnecessarily large |
| Local temporary files and terminal history | May contain operational or secret material |

## Controlled credential-transfer checklist

1. Verify the buyer/legal entity and signed transfer authorization.
2. Create individual accounts for the buyer’s technical lead and operations lead; do not share one founder password.
3. Transfer GitHub repository ownership or grant least-privilege access.
4. Transfer Render ownership or create a target deployment under the buyer’s organization.
5. Transfer/replace Supabase organization ownership and regenerate privileged keys after access changes.
6. Transfer Expo organization/project access; preserve package name and signing continuity where lawful.
7. For iOS, transfer App Store Connect roles and signing assets through Apple’s approved process.
8. Rotate all high-privilege secrets after handover and record completion in an access audit.
9. Deliver a separate encrypted data export only to authorized recipients, with retention and deletion terms.

## Archive verification procedure

The recipient should verify the archive checksum, unzip in an isolated directory, inspect the manifest, search for accidental secret files, install dependencies from lockfiles, run web/native checks, and build a non-production deployment before touching production. A successful archive extraction alone is not proof that a production cutover is safe.

## Buyer acceptance checklist

- [ ] Source repository clones successfully from the transferred owner.
- [ ] Web tests and production build pass.
- [ ] Native TypeScript and architecture checks pass.
- [ ] Supabase migration history can be read and staged.
- [ ] Secret inventory is complete but secret values are not in the archive.
- [ ] Domain, hosting, Supabase, Expo, GitHub, and Apple ownership status are documented.
- [ ] Authorized data export procedure and retention obligations are signed off.
- [ ] Rollback plan and incident contacts are accepted.
