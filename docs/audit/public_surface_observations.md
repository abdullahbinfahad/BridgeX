# BridgeX Public Surface Audit Notes

Date reviewed: 2026-08-20 (GMT+8)

## Observed working public surfaces

The production homepage loaded successfully at `https://bridgex.abdullahbinfahad.info/`. It exposed public navigation, post creation entry points, marketplace access, visible recent-post cards, verification badges, ratings (including `0.0 (0)`), and a payment-safety explanation. The public Marketplace route also loaded its navigation, request/carry tabs, search field, category selector, refresh action, and pagination controls for guest visitors.

## Observed audit signal

The guest Marketplace route initially displayed `Loading live posts…` rather than cards during the browser inspection. A subsequent view completed and showed four public item-request cards. The query therefore completed successfully in that check, but the initial state is visible enough to merit a bounded timeout and explicit retry/error presentation. The marketplace cards showed source/destination, weight, delivery timing, size, handling, budget, profile verification, rating, and response indicators.

The signed-in public header also displayed the unread-update popup. It correctly preserved multiple payment-related updates as separate paragraphs, but the popup can contain several long items at once. This supports the new dedicated Payment history badge and suggests that the toast should cap itself to the newest one or two full updates, with a direct call-to-action to open Payment history for the rest.

## Product implication

Public discovery is core to marketplace liquidity. The guest marketplace query and its empty/loading/error states should be treated as a release-gate flow before public marketing or a larger paid acquisition campaign.
