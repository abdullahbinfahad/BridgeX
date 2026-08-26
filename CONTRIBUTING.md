# Contributing to BridgeX

Thank you for helping improve BridgeX. Contributions are welcome when they are privacy-safe, lawful, tested, and understandable to future maintainers.

## Development Workflow

1. Open an issue or discuss an architectural change before a large implementation.
2. Create a feature branch from the current default branch.
3. Follow the relevant web, mobile, Supabase, or desktop conventions.
4. Write or update automated tests and verify denied/error paths as well as success paths.
5. Update migrations and documentation when a data contract, RLS policy, RPC, release step, or user-visible behavior changes.
6. Submit a pull request using the repository template.

## Branch Naming

feature/feature-name

bugfix/issue-name

hotfix/critical-fix

docs/document-name

## Commit Message Format

feat:

fix:

docs:

style:

refactor:

test:

chore:

Examples

feat: add traveler listing

fix: login validation

docs: update api documentation

## Code and security standards

- Use TypeScript
- Use meaningful variable names
- Keep functions small
- Avoid duplicated code
- Write reusable components
- Keep frontend visibility checks separate from server-side/RLS authorization.
- Never commit `.env` files, credentials, user documents, payment proofs, production exports, or private messages.
- Do not create fake ratings, reviews, testimonials, or member data.
- Keep mobile clients limited to publishable public configuration; service-role keys belong only in server-side secrets.

## Pull Requests

Every pull request should include

- Description
- Screenshots (if UI changes)
- Testing information
- Related issue
- A statement of how RLS, authorization, privacy, and rollback were considered when relevant.
