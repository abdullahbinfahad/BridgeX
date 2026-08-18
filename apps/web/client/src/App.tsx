import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";

const Home = lazy(() => import("./pages/Home")); const Marketplace = lazy(() => import("./pages/Marketplace")); const Access = lazy(() => import("./pages/Access")); const Workspace = lazy(() => import("./pages/Workspace")); const OfferPage = lazy(() => import("./pages/OfferPage")); const InterestPage = lazy(() => import("./pages/InterestPage")); const Onboarding = lazy(() => import("./pages/Onboarding")); const AdminControl = lazy(() => import("./pages/AdminControl")); const AdminChats = lazy(() => import("./pages/AdminChats")); const ReportIncident = lazy(() => import("./pages/ReportIncident")); const PostDetail = lazy(() => import("./pages/PostDetail")); const NotificationsPage = lazy(() => import("./pages/NotificationsPage")); const NotFound = lazy(() => import("./pages/NotFound")); const HowItWorks = lazy(() => import("./pages/MarketingPages").then(module => ({ default: module.HowItWorks }))); const SafetyPage = lazy(() => import("./pages/MarketingPages").then(module => ({ default: module.SafetyPage }))); const FaqPage = lazy(() => import("./pages/MarketingPages").then(module => ({ default: module.FaqPage }))); const StandardPage = lazy(() => import("./pages/MarketingPages").then(module => ({ default: module.StandardPage }))); const CreateRequest = lazy(() => import("./pages/CreateFlow").then(module => ({ default: module.CreateRequest }))); const CreateListing = lazy(() => import("./pages/CreateFlow").then(module => ({ default: module.CreateListing })));

function AdminRoute() {
  const [location] = useLocation();
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f7f5ef] text-sm font-semibold text-[#637073]">Loading administrator controls…</div>;
  if (!user) return <Access />;
  if (user.role !== "admin") return <div className="grid min-h-screen place-items-center bg-[#f7f5ef] px-5"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="font-display text-3xl font-bold">Administrator access required</h1><p className="mt-3 text-sm leading-6 text-[#637073]">This control panel is restricted to accounts granted the BridgeX administrator role.</p></div></div>;
  return location.startsWith("/admin/chats") ? <AdminChats /> : <AdminControl />;
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
      <Route path={"/contact"}>{() => <StandardPage type="contact" />}</Route>
      <Route path={"/terms"}>{() => <StandardPage type="terms" />}</Route>
      <Route path={"/privacy"}>{() => <StandardPage type="privacy" />}</Route>
      <Route path={"/create-request"} component={CreateRequest} />
      <Route path={"/create-listing"} component={CreateListing} />
      <Route path={"/offer"} component={OfferPage} />
      <Route path={"/interest"} component={InterestPage} />
      <Route path={"/post/:kind/:id"} component={PostDetail} />
      <Route path={"/access"} component={Access} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/report-incident"} component={ReportIncident} />
      <Route path={"/dashboard"} component={Workspace} />
      <Route path={"/dashboard/:section"} component={Workspace} />
      <Route path={"/notifications"} component={NotificationsPage} />
      <Route path={"/admin"} component={AdminRoute} />
      <Route path={"/admin/chats"} component={AdminRoute} />
      <Route path={"/admin/:section"} component={AdminRoute} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
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
          <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#f7f5ef] text-sm font-semibold text-[#637073]">Loading BridgeX…</div>}><Router /></Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
