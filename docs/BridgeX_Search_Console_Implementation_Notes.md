# BridgeX Search Console Implementation Notes

## Live verification recorded on 2026-08-22

The public BridgeX crawler assets are reachable at the production domain:

| Asset | Public URL | Observed state |
|---|---|---|
| Robots policy | `https://bridgex.abdullahbinfahad.info/robots.txt` | Allows general crawling and blocks private dashboard, administration, onboarding, and compose routes. |
| XML sitemap | `https://bridgex.abdullahbinfahad.info/sitemap.xml` | Serves the canonical public homepage, marketplace, public help, safety, legal, and contact URLs. |

## Submission sequence

Add a **Domain property** for `abdullahbinfahad.info` in Google Search Console, publish the DNS TXT verification value supplied by Google at the DNS provider, and then submit the production sitemap URL above in the Sitemaps report. Request indexing with URL Inspection for the homepage, marketplace, and how-it-works pages after verification.

Google states that a sitemap is a discovery hint rather than a guarantee of indexing, and an individual recrawl request can take days to weeks. The canonical URL in the document head and canonical URLs in the sitemap should remain aligned.

## Official references

1. [Google Search Console — Verify your site ownership](https://support.google.com/webmasters/answer/9008080?hl=en)
2. [Google Search Central — Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
3. [Google Search Central — Ask Google to recrawl your URLs](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)
4. [Google Search Central — Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
