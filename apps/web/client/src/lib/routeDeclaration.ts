export type ServiceScope = "domestic" | "international";

export function routeScopeFromCountries(origin: string | null | undefined, destination: string | null | undefined): ServiceScope {
  const normalizedOrigin = origin?.trim().toLocaleLowerCase();
  const normalizedDestination = destination?.trim().toLocaleLowerCase();
  return normalizedOrigin && normalizedDestination && normalizedOrigin === normalizedDestination ? "domestic" : "international";
}

export function isInternationalService(scope: ServiceScope) {
  return scope === "international";
}
