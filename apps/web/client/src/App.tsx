import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import { FaqPage, HowItWorks, SafetyPage, StandardPage } from "./pages/MarketingPages";
import { CreateListing, CreateRequest } from "./pages/CreateFlow";
import Workspace, { AdminWorkspace } from "./pages/Workspace";
import Access from "./pages/Access";
import OfferPage from "./pages/OfferPage";
import Onboarding from "./pages/Onboarding";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminControl from "./pages/AdminControl";
import ReportIncident from "./pages/ReportIncident";

function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f7f5ef] text-sm font-semibold text-[#637073]">Loading administrator controls…</div>;
  if (!user) return <Access />;
  if (user.role !== "admin") return <div className="grid min-h-screen place-items-center bg-[#f7f5ef] px-5"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="font-display text-3xl font-bold">Administrator access required</h1><p className="mt-3 text-sm leading-6 text-[#637073]">This control panel is restricted to accounts granted the BridgeX administrator role.</p></div></div>;
  return <AdminControl />;
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
      <Route path={"/access"} component={Access} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/report-incident"} component={ReportIncident} />
      <Route path={"/dashboard"} component={Workspace} />
      <Route path={"/dashboard/:section"} component={Workspace} />
      <Route path={"/admin"} component={AdminRoute} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
