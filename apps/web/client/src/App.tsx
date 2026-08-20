import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { playBridgeXFeedback } from "@/lib/feedback";
import DeliveryLoader from "@/components/bridgex/DeliveryLoader";
import { ChevronLeft } from "lucide-react";

const Home = lazy(() => import("./pages/Home")); const Marketplace = lazy(() => import("./pages/Marketplace")); const Access = lazy(() => import("./pages/Access")); const ResetPassword = lazy(() => import("./pages/ResetPassword")); const Workspace = lazy(() => import("./pages/Workspace")); const ReviewsPage = lazy(() => import("./pages/ReviewsPage")); const OfferPage = lazy(() => import("./pages/OfferPage")); const InterestPage = lazy(() => import("./pages/InterestPage")); const Onboarding = lazy(() => import("./pages/Onboarding")); const AdminControl = lazy(() => import("./pages/AdminControl")); const AdminExchangeRates = lazy(() => import("./pages/AdminExchangeRates")); const SuperAdminControl = lazy(() => import("./pages/SuperAdminControl")); const AdminChats = lazy(() => import("./pages/AdminChats")); const AdminEnquiries = lazy(() => import("./pages/AdminEnquiries")); const AdminVerificationPerson = lazy(() => import("./pages/AdminVerificationPerson")); const AdminPaymentReview = lazy(() => import("./pages/AdminPaymentReview")); const ReportIncident = lazy(() => import("./pages/ReportIncident")); const PostDetail = lazy(() => import("./pages/PostDetail")); const MemberProfile = lazy(() => import("./pages/MemberProfile")); const ContactPage = lazy(() => import("./pages/ContactPage")); const NotificationsPage = lazy(() => import("./pages/NotificationsPage")); const NotFound = lazy(() => import("./pages/NotFound")); const HowItWorks = lazy(() => import("./pages/MarketingPages").then(module => ({ default: module.HowItWorks }))); const SafetyPage = lazy(() => import("./pages/MarketingPages").then(module => ({ default: module.SafetyPage }))); const FaqPage = lazy(() => import("./pages/MarketingPages").then(module => ({ default: module.FaqPage }))); const StandardPage = lazy(() => import("./pages/MarketingPages").then(module => ({ default: module.StandardPage }))); const CreateRequest = lazy(() => import("./pages/CreateFlow").then(module => ({ default: module.CreateRequest }))); const CreateListing = lazy(() => import("./pages/CreateFlow").then(module => ({ default: module.CreateListing })));

function AdminRoute() {
  const [location] = useLocation();
  const { user, loading } = useAuth();
  if (loading) return <DeliveryLoader label="Preparing secure controls" description="Loading your administrator workspace…" />;
  if (!user) return <Access />;
  if (user.role !== "admin" && user.role !== "super_admin") return <div className="grid min-h-screen place-items-center bg-[#f7f5ef] px-5"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="font-display text-3xl font-bold">Administrator access required</h1><p className="mt-3 text-sm leading-6 text-[#637073]">This control panel is restricted to accounts granted the BridgeX administrator role.</p></div></div>;
  return location.startsWith("/admin/super") ? <SuperAdminControl /> : location.startsWith("/admin/chats") ? <AdminChats /> : location.startsWith("/admin/enquiries") ? <AdminEnquiries /> : location.startsWith("/admin/verification-person") ? <AdminVerificationPerson /> : location.startsWith("/admin/payment-review") ? <AdminPaymentReview /> : location.startsWith("/admin/exchange-rates") ? <AdminExchangeRates /> : <AdminControl />;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/marketplace"} component={Marketplace} />
      <Route path={"/how-it-works"} component={HowItWorks} />
      <Route path={"/safety"} component={SafetyPage} />
      <Route path={"/faq"} component={FaqPage} />
      <Route path={"/about"}>{() => <StandardPage type="about" />}</Route>
      <Route path={"/contact"} component={ContactPage} />
      <Route path={"/terms"}>{() => <StandardPage type="terms" />}</Route>
      <Route path={"/privacy"}>{() => <StandardPage type="privacy" />}</Route>
      <Route path={"/create-request"} component={CreateRequest} />
      <Route path={"/create-listing"} component={CreateListing} />
      <Route path={"/offer"} component={OfferPage} />
      <Route path={"/interest"} component={InterestPage} />
      <Route path={"/post/:kind/:id"} component={PostDetail} />
      <Route path={"/member/:id"} component={MemberProfile} />
      <Route path={"/access"} component={Access} />
      <Route path={"/reset-password"} component={ResetPassword} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/report-incident"} component={ReportIncident} />
      <Route path={"/dashboard/reviews"} component={ReviewsPage} />
      <Route path={"/dashboard"} component={Workspace} />
      <Route path={"/dashboard/:section"} component={Workspace} />
      <Route path={"/notifications"} component={NotificationsPage} />
      <Route path={"/admin"} component={AdminRoute} />
      <Route path={"/admin/super"} component={AdminRoute} />
      <Route path={"/admin/verification-person"} component={AdminRoute} />
      <Route path={"/admin/chats"} component={AdminRoute} />
      <Route path={"/admin/enquiries"} component={AdminRoute} />
      <Route path={"/admin/:section"} component={AdminRoute} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function GlobalInteractionFeedback() {
  useEffect(() => {
    const onInteraction = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!event.defaultPrevented && target?.closest("button,a,[role='button']")) playBridgeXFeedback("tap");
    };
    window.addEventListener("click", onInteraction, { passive: true });
    return () => window.removeEventListener("click", onInteraction);
  }, []);
  return null;
}

function GlobalBackButton() {
  const [location, setLocation] = useLocation();
  const hasDetailQuery = Boolean(window.location.search);
  const parent = location === "/" ? "" : location.startsWith("/admin/") ? "/admin" : location.startsWith("/dashboard/deals") && hasDetailQuery ? "/dashboard/deals" : location.startsWith("/dashboard") || location === "/notifications" ? "/dashboard" : location.startsWith("/post/") || location.startsWith("/member/") || location.startsWith("/offer") || location.startsWith("/interest") ? "/marketplace" : "/";
  if (!parent) return null;
  return <button onClick={() => setLocation(parent)} className="bridgex-global-back fixed bottom-5 left-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-[#172126]/10 px-3.5 py-2 text-xs font-bold text-[#304044] shadow-lg sm:left-6"><ChevronLeft className="size-4" />Back</button>;
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <GlobalInteractionFeedback />
          <GlobalBackButton />
          <Suspense fallback={<DeliveryLoader />}><Router /></Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
