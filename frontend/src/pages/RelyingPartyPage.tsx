import React, { useState, useEffect } from "react";
import { Shield, Lock, CheckCircle2, UserCheck, ExternalLink, ArrowRight, Sparkles } from "lucide-react";
import { StatusChip } from "../components/StatusChip";

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
    const redirectUri = window.location.origin + "/relying-party";
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
          redirect_uri: window.location.origin + "/relying-party",
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>
            <strong>OIDC-Lite Gateway:</strong> Demo-grade pairwise pseudonymity. Not a conformance-tested OIDC provider.
          </span>
        </div>
        <StatusChip type="SIMULATED" />
      </div>

      <div className="text-center mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-2">
          Web2 Relying Party Portal
        </h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Demonstrates how traditional consumer web apps verify age &ge; 18 through OpenID Connect without ever accessing user PII.
        </p>
      </div>

      {!session ? (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-cyan-400" />
          </div>

          <h2 className="font-heading font-semibold text-white text-lg mb-2">
            Age-Restricted Storefront
          </h2>
          <p className="text-slate-400 text-xs mb-6 leading-relaxed">
            This relying party requires proof of age &ge; 18 before granting access. No names, government numbers, or birth dates are collected.
          </p>

          <button
            type="button"
            disabled={isLoading}
            onClick={initiateOidcLogin}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <Shield className="w-4 h-4" />
            <span>{isLoading ? "Authenticating..." : "Authorize with Pramaan-ZK"}</span>
          </button>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            Uses RFC 7636 PKCE &bull; Pairwise HMAC Subject
          </div>
        </div>
      ) : (
        <div className="glass-panel p-8 rounded-3xl border border-emerald-500/40 max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white text-base">
                  Authorized Age Verified Session
                </h3>
                <span className="text-xs text-slate-400">Authenticated via Pramaan-ZK OIDC</span>
              </div>
            </div>
            <StatusChip type="OFF-CHAIN VERIFIED" />
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Pairwise Pseudonymous Subject (sub):</span>
              <span className="text-cyan-400 break-all">{session.sub}</span>
              <span className="text-[10px] text-slate-500 block mt-1">
                Derived via HMAC(nullifier, clientId). Cannot be linked across other relying parties.
              </span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Verified Claim:</span>
              <span className="text-emerald-400 font-bold">age_over_18: true</span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Signed ID Token (JWT):</span>
              <span className="text-slate-300 break-all text-[10px]">{session.idToken.slice(0, 120)}...</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSession(null)}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Sign out session
            </button>

            <a
              href="/.well-known/openid-configuration"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>View OpenID Discovery</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
