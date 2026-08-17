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
      <Route path={"/dashboard"} component={Workspace} />
      <Route path={"/dashboard/:section"} component={Workspace} />
      <Route path={"/admin"} component={AdminWorkspace} />
      <Route path={"/admin/:section"} component={AdminWorkspace} />
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
