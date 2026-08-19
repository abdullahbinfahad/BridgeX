# BridgeX External Research Notes

## Marketplace trust, privacy, and safety

The CHI 2024 study by Mokhberi et al. examined 42 Facebook Marketplace users in the United States and Canada. It frames peer-to-peer decision-making through four categories: pre-existing concerns, signals, interactions, and perceived benefits. It also highlights a tension relevant to BridgeX: revealing personal information may act as a trust signal but can create privacy and safety concerns. The study describes physical, financial, and fraud risks in peer-to-peer marketplace activity, supporting BridgeX's protected matching, private contact release, verification, reviews, reporting, and administrator review design.

Source: [ACM CHI 2024 — Trust, Privacy, and Safety Factors Associated with Decision Making in P2P Markets](https://dl.acm.org/doi/full/10.1145/3613904.3641966)

## Practitioner trust-and-safety controls

Persona’s marketplace trust-and-safety guidance recommends a combination of identity verification, re-verification at higher-risk moments, two-factor authentication, activity monitoring, link analysis, manual review, clear conduct rules, and measurement of reports, fraudulent accounts/listings, policy violations, exposure, mitigation time, and chargebacks. Its core product-design message is that platform trust requires both preventative and remedial controls rather than a single verification moment.

Source: [Persona — Trust and safety: How it helps create a better online marketplace](https://withpersona.com/blog/trust-and-safety-create-better-online-marketplace/)

Trulioo’s marketplace guidance emphasizes risk-based onboarding, information needed for traceability, verification of participants and listings, communication channels, payment handling, customer support, and different verification depth by risk level. It notes that when a platform handles payments, revenue and operational/compliance risk both increase.

Source: [Trulioo — Why Trust Is Crucial for an Online Marketplace Platform](https://www.trulioo.com/industries/marketplaces-identity-verification/trust-safety)

## First-hand workshop evidence

A Persona marketplace trust-and-safety workshop characterized risk as a spectrum rather than a binary. The workshop recommended dynamic friction: lower-friction completion for low-risk users, automatic decline or escalation for high-risk signals, and manual review where the signal needs investigation. Concrete risk signals discussed included identity fraud, account-change events, high-value payouts, suspicious contact or location mismatches, VPN/proxy use, disposable email domains, multiple-account abuse, user reports, and chargebacks. Recommended controls included government-ID verification, selfie/biometric checks, NFC passport scanning, phone/email confirmation, proof of address, two-factor authentication, and link/graph analysis.

Source video: [Marketplace Trust & Safety Workshop](https://www.youtube.com/watch?v=sh0meBwTdhI)

## China Customs and traveler-carried goods

China Customs’ passenger guide states that inbound and outbound passengers are subject to Customs control and must declare truthfully. It states that traveler-carried personal articles must be for personal use and within reasonable quantity. Travelers with items to declare must choose the Goods to Declare channel. The guide identifies items of commercial value, selected high-value personal articles, certain animals/plants and products, communications equipment, and restricted/prohibited items as categories requiring declaration or control. It lists prohibited imports including arms/ammunition/explosives, counterfeit currency/securities, deadly poisons, narcotics and psychotropic substances, specific animals/plants and disease-related materials, and items harmful to human or livestock health.

Sources: [General Administration of Customs of the People’s Republic of China — Customs Clearance Guide for International Passengers](http://english.customs.gov.cn/statics/88707c1e-aa4e-40ca-a968-bdbdbb565e4f.html); [State Council of the PRC — Customs FAQ for Inbound and Outbound Passengers](https://english.www.gov.cn/services/visitchina/202008/04/content_WS5f2905dec6d029c1c26372f0.html)

## Documentation implications

BridgeX public materials should describe verification, reporting, privacy-controlled contact release, private payment proofs, administrator review, real reviews, and prohibited-item warnings as platform safeguards rather than guarantees. They should clearly state that users remain responsible for accurate descriptions and compliance with customs, airline, carrier, import/export, and destination-country requirements; the marketplace cannot provide legal clearance or replace official Customs guidance.
