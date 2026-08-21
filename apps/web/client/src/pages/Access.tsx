import { useAuth } from "@/_core/hooks/useAuth";
import { Brand } from "@/components/bridgex/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { signedInDestination } from "@shared/bridgeXControls";
import { ArrowLeft, CheckCircle2, Chrome, Eye, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

type AccessMode = "signin" | "signup";

export default function Access() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<AccessMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const [googleStarting, setGoogleStarting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    if (!loading && isAuthenticated) setLocation(signedInDestination(Boolean(user?.onboardingComplete)));
  }, [isAuthenticated, loading, setLocation, user?.onboardingComplete]);

  const reportError = (message: string) => {
    setFailed(true);
    setNotice(message);
  };

  const submit = async () => {
    setNotice("");
    setFailed(false);

    if (!email || password.length < 8) {
      reportError("Use a valid email and a password of at least 8 characters.");
      return;
    }

    setSending(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/access` },
      });

      setSending(false);

      if (error) {
        reportError(error.message);
        return;
      }

      setNotice(
        data.session
          ? "Account created. Continuing to your BridgeX profile…"
          : "Check your email inbox and confirm your address before signing in. Also check your spam folder."
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSending(false);

    if (error) {
      setFailedAttempts(current => current + 1);
      reportError(/email not confirmed/i.test(error.message) ? "Confirm your email from the BridgeX message in your inbox before signing in." : "We could not sign you in. Check your email and password.");
      return;
    }

    setNotice("Signed in. Opening your BridgeX profile…");
  };

  const signInWithGoogle = async () => {
    setNotice("");
    setFailed(false);
    setGoogleStarting(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });

    if (error) {
      setGoogleStarting(false);
      reportError(`Google sign-in could not start: ${error.message}`);
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f7f5ef] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden bg-[#172126] p-10 text-[#f7f5ef] lg:flex lg:flex-col">
        <Brand className="[&>span:last-child]:text-[#f7f5ef]" />
        <div className="my-auto max-w-md">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#2d8d62] text-white">
            <ShieldCheck className="size-6" />
          </span>
          <h1 className="mt-7 font-display text-5xl font-bold leading-tight tracking-[-0.05em]">
            Protected orders start with a trusted account.
          </h1>
          <p className="mt-5 text-sm leading-7 text-[#c3d0c9]">
            Sign in with your email and password or a protected Google account without leaving BridgeX.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[440px]">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#176447]">
            <ArrowLeft className="size-4" />
            Back to BridgeX
          </Link>

          <div className="mt-9 rounded-3xl border border-[#172126]/8 bg-white p-7 sm:p-8">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#dff5ea] text-[#176447]">
              <ShieldCheck className="size-5" />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Account access</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.05em]">
              {mode === "signin" ? "Welcome back." : "Create your account."}
            </h2>

            <Button
              disabled={sending || googleStarting}
              onClick={signInWithGoogle}
              variant="outline"
              className="mt-6 h-11 w-full rounded-xl border-[#172126]/15 bg-white font-bold text-[#172126] hover:bg-[#f4faf5]"
            >
              {googleStarting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Chrome className="mr-2 size-4" />}
              {googleStarting ? "Opening Google…" : "Continue with Google"}
            </Button>

            <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#899490]" aria-hidden="true">
              <span className="h-px flex-1 bg-[#172126]/10" />
              or use email
              <span className="h-px flex-1 bg-[#172126]/10" />
            </div>

            <div className="grid grid-cols-2 rounded-xl bg-[#f3f1eb] p-1">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`h-9 rounded-lg text-sm font-bold ${mode === "signin" ? "bg-white shadow-sm" : "text-[#687579]"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`h-9 rounded-lg text-sm font-bold ${mode === "signup" ? "bg-white shadow-sm" : "text-[#687579]"}`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
              {mode === "signup" && (
                <Input
                  className="mt-5 h-11 rounded-xl"
                  placeholder="Display name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              )}
              <Input
                className="mt-3 h-11 rounded-xl"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Input
                className="mt-3 h-11 rounded-xl"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={8}
                placeholder="Password (at least 8 characters)"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Button type="submit" disabled={sending || googleStarting} className="mt-3 h-11 w-full rounded-xl bg-[#172126] font-bold">
                {sending ? "Please wait…" : mode === "signin" ? "Sign in securely" : "Create secure account"}
              </Button>
            </form>

            {mode === "signup" && <p className="mt-3 text-xs leading-5 text-[#637073]">For email-password accounts, BridgeX sends a confirmation message to this address. Confirm it before your first sign-in.</p>}

            {notice && <p className={`mt-3 text-sm ${failed ? "text-[#a64236]" : "text-[#176447]"}`}>{notice}</p>}
            {mode === "signin" && failedAttempts >= 3 && <Link href="/contact?topic=password-reset" className="mt-2 inline-flex text-xs font-bold text-[#176447] hover:underline">Need password-reset help? Contact BridgeX</Link>}

            <Button
              onClick={() => setLocation("/marketplace?guest=1")}
              variant="outline"
              className="mt-4 h-11 w-full rounded-xl bg-white font-bold"
            >
              <Eye className="mr-2 size-4" />
              Browse as guest
            </Button>

            <div className="mt-5 rounded-xl bg-[#f4faf5] p-3 text-xs leading-5 text-[#526063]">
              <CheckCircle2 className="mr-1 inline size-3.5 text-[#2d8d62]" />
              Guests can only view marketplace posts and details. Posting, offers, orders, messages, uploads, verification, and wallet actions require sign-in.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
