export type AppRoute = "home" | "marketplace" | "create" | "workspace" | "messages" | "notifications" | "payments" | "settings" | "verification" | "admin" | "post" | "profile" | "respond";
export type MarketplaceTab = "requests" | "carry";
export type ServiceScope = "domestic" | "international";

export type BridgeXProfile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_path?: string | null;
  role?: "member" | "admin" | "super_admin" | string | null;
  is_verified?: boolean | null;
  verification_status?: string | null;
  onboarding_complete?: boolean | null;
  suspended?: boolean | null;
  restriction_reason?: string | null;
  preferred_currency?: string | null;
  preferred_language?: string | null;
  phone?: string | null;
  current_country?: string | null;
  current_city?: string | null;
  current_address?: string | null;
  home_country?: string | null;
  home_city?: string | null;
  home_address?: string | null;
  china_address?: string | null;
};

export type MarketplacePost = {
  id: string;
  kind: MarketplaceTab;
  ownerId: string;
  title: string;
  route: string;
  price: number;
  currency: string;
  weight: string;
  category?: string | null;
  createdAt: string;
  mediaPaths: string[];
  status: string;
};

export type NativeNotification = { id: string; title?: string | null; body?: string | null; created_at: string; read_at?: string | null; related_id?: string | null; type?: string | null; link?: string | null };
