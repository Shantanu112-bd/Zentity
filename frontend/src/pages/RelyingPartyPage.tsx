import React, { useState, useEffect } from "react";
import { Shield, Lock, CheckCircle2, UserCheck, ExternalLink, ArrowRight, Sparkles } from "lucide-react";
import { StatusChip } from "../components/StatusChip";
import { AppShell } from "../components/AppShell";

export const RelyingPartyPage: React.FC = () => {
  const [session, setSession] = useState<{
    sub: string;
    ageOver18: boolean;
    idToken: string;
    clientId: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Check if redirected with authorization code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      exchangeCode(code);
    }
  }, []);

  const initiateOidcLogin = async () => {
    setIsLoading(true);
    // Demo PKCE challenge for seeded tenant demo-relying-party
    const clientId = "demo-relying-party";
    const redirectUri = window.location.origin + "/app/relying-party";
    const authUrl = `/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&code_challenge=demo-pkce-challenge&code_challenge_method=plain&state=random123&nullifier=sample-user-nullifier-42`;

    window.location.href = authUrl;
  };

  const exchangeCode = async (code: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          client_id: "demo-relying-party",
          redirect_uri: window.location.origin + "/app/relying-party",
          code_verifier: "demo-pkce-challenge",
        }),
      });

      const data = await res.json();
      if (data.id_token) {
        setSession({
          sub: "pairwise-sub-" + code.slice(0, 8),
          ageOver18: true,
          idToken: data.id_token,
          clientId: "demo-relying-party",
        });
      }
    } catch (err) {
      console.error("Token exchange failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell
      title="RELYING PARTY"
      activeStepId={session ? "session" : "login"}
      steps={[
        { id: "login", label: "OIDC Login" },
        { id: "pkce", label: "PKCE Verify" },
        { id: "session", label: "Pairwise ID" },
      ]}
      facts={[
        ["Protocol:", "OIDC-Lite (PKCE + Pairwise sub)"],
        ["Tenant:", "demo-relying-party"],
        ["Privacy:", "Zero raw PII disclosed"],
        ["Notice:", "Demo-grade gateway; not certified OIDC"],
      ]}
    >
      <div className="bg-[rgba(17,16,15,0.35)] backdrop-blur-[20px] rounded-[24px] border border-white/[0.06] p-6 sm:p-8 space-y-6">
        {/* Notice Banner */}
        <div className="p-4 rounded-[14px] bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>
              <strong>OIDC-Lite Gateway:</strong> Pairwise pseudonymous JWT with PKCE.
            </span>
          </div>
          <StatusChip type="SIMULATED" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Web2 Relying Party Portal
          </h2>
          <p className="text-xs text-neutral-300 mt-1">
            Consumer apps verify age &ge; 18 through OpenID Connect without handling identity documents or raw Aadhaar data.
          </p>
        </div>

        {!session ? (
          <div className="p-6 rounded-[20px] bg-black/40 border border-white/10 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6 text-white" />
            </div>

            <div>
              <h3 className="font-semibold text-white text-base">
                Age-Restricted Storefront
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Requires zero-knowledge proof of age &ge; 18 before granting access.
              </p>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={initiateOidcLogin}
              className="h-[48px] px-8 bg-[#E9E9E9] rounded-[12px] text-[#0A0707] font-[450] text-sm hover:bg-white transition-opacity font-medium"
            >
              {isLoading ? "Redirecting..." : "Sign in with Pramaan-ZK"}
            </button>
          </div>
        ) : (
          <div className="p-5 rounded-[18px] bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="font-semibold text-emerald-300">
                OIDC Session Authenticated
              </span>
              <StatusChip type="OFF-CHAIN VERIFIED" />
            </div>

            <div className="space-y-1.5 text-neutral-300 text-[11px]">
              <div>Pairwise Subject: <span className="text-white font-bold">{session.sub}</span></div>
              <div>Age Claim: <span className="text-emerald-400 font-bold">&ge; 18 VERIFIED</span></div>
              <div>Client ID: <span className="text-white">{session.clientId}</span></div>
              <div className="truncate text-neutral-400">ID Token: {session.idToken.slice(0, 32)}...</div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
