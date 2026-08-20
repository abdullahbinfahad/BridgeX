# Workspace, Verification, and Android Navigation Diagnosis — 2026-08-21

The Member Workspace content is routed through `Workspace.tsx`, but the persistent sidebar navigation labels and order are owned by `components/DashboardLayout.tsx`. The requested sequence must therefore be applied in the shared dashboard layout without changing the existing Workspace route paths.

`GlobalVerification.tsx` currently renders the document-upload UI for every authenticated member. It must branch early when `user.verificationStatus === "approved"` and show a verified-account status, privacy boundary, and practical benefits rather than allowing duplicate document submission.

The source already includes Android marker detection. The user-visible Back button in the screenshots is consistent with the Render outage holding an earlier web deployment in place; a more durable native injection marker can be added, but the browser bundle must be deployed before existing Android WebViews can receive the rendered-control removal.
