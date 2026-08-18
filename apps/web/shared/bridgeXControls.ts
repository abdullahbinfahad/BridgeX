export const INCIDENT_CATEGORIES = [
  ["suspected_fraud", "Suspected fraud or payment issue"],
  ["unsafe_item", "Unsafe, prohibited, or illegal item"],
  ["harassment", "Harassment, threats, or coercion"],
  ["identity_misuse", "Identity or document misuse"],
  ["other", "Other safety concern"],
] as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number][0];

export function canSubmitIncidentReport(category: string, description: string, consentConfirmed: boolean) {
  return INCIDENT_CATEGORIES.some(([value]) => value === category) && description.trim().length >= 20 && consentConfirmed;
}

export function signedInDestination(onboardingComplete: boolean) {
  return onboardingComplete ? "/dashboard" : "/onboarding";
}

export const ORDER_ADMIN_ACTIONS = [
  ["fund", "Mark escrow funded"],
  ["hold", "Place escrow on hold"],
  ["transit", "Mark in transit"],
  ["delivered", "Mark delivered"],
  ["release", "Release escrow"],
  ["dispute", "Open dispute"],
] as const;

export type OrderAdminAction = (typeof ORDER_ADMIN_ACTIONS)[number][0];

export function orderUpdateForAdminAction(action: OrderAdminAction) {
  switch (action) {
    case "fund":
      return { escrow_status: "funded" };
    case "hold":
      return { escrow_status: "held" };
    case "transit":
      return { fulfillment_status: "in_transit" };
    case "delivered":
      return { fulfillment_status: "delivered" };
    case "release":
      return { escrow_status: "released", fulfillment_status: "completed" };
    case "dispute":
      return { escrow_status: "disputed", fulfillment_status: "disputed" };
  }
}
