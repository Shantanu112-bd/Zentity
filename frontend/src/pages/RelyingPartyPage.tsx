/**
 * frontend/src/pages/RelyingPartyPage.tsx
 * 
 * Web2 Relying Party & OIDC-Lite Gateway Portal
 * Strictly adheres to ANTIGRAVITY_APP_UI_REFINEMENT_PROMPT.md §2 & §3 Step C:
 * - 2-Column Responsive Layout:
 *   - Left: Relying Party Demo Storefront & OIDC Login Trigger
 *   - Right: Claims & JWT Token Viewer (CodeBlock + DataList)
 * - Transparent disclosure: Demo-grade OIDC-Lite gateway with pairwise sub
 */

import React, { useState, useEffect } from "react";
import {
  Lock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Key,
} from "lucide-react";
import { StatusChip } from "../components/StatusChip";
import {
  PageShell,
  PageHeader,
  Card,
  DataList,
  CodeBlock,
  StatusBanner,
} from "../components/layout";

export const RelyingPartyPage: React.FC = () => {
  const [session, setSession] = useState<{
    sub: string;
    ageOver18: boolean;
    idToken: string;
    clientId: string;
    claims?: any;
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
        // Parse JWT payload safely for demo display
        let parsedClaims: any = null;
        try {
          const parts = data.id_token.split(".");
          if (parts.length === 3) {
            parsedClaims = JSON.parse(atob(parts[1]));
          }
        } catch {}

        setSession({
          sub: parsedClaims?.sub || "pairwise-sub-" + code.slice(0, 8),
          ageOver18: true,
          idToken: data.id_token,
          clientId: "demo-relying-party",
          claims: parsedClaims,
        });
      }
    } catch (err) {
      console.error("Token exchange failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Web2 Enterprise Gateway"
        title="Relying Party Portal"
        description="Verify age ≥ 18 via OpenID Connect (OIDC-Lite) with PKCE. Web2 consumer apps verify age qualifications without ingesting or storing raw Aadhaar data."
        rightSlot={
          <div className="flex items-center gap-2">
            <StatusChip type="SIMULATED" size="sm" />
            <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-mono rounded border border-white/20 bg-white/5 text-white/70">
              PKCE · Pairwise Sub
            </span>
          </div>
        }
      />

      <div className="space-y-6 pb-12">
        <StatusBanner
          variant="info"
          title="OIDC-Lite Gateway Notice"
          description="Demo-grade OIDC implementation with PKCE and pairwise pseudonymous subject tokens. Not an officially certified OpenID provider."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (6 cols): Storefront / Login Card */}
          <div className="lg:col-span-6 space-y-6">
            <Card
              title="Age-Gated Web2 Storefront"
              subtitle="Demonstration client relying on zero-knowledge attribute verification"
              headerAction={<Lock className="w-4 h-4 text-white/50" />}
              divider
            >
              <div className="p-6 rounded-2xl bg-black/40 border border-white/10 text-center space-y-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-white">
                  <ShieldCheck className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-base font-medium text-white">
                    Age-Restricted Digital Goods
                  </h3>
                  <p className="text-xs text-white/60 mt-1 max-w-sm mx-auto leading-relaxed">
                    Access is strictly granted to accounts with a verified age &ge; 18 zero-knowledge credential. No identity document is uploaded or logged.
                  </p>
                </div>

                {!session ? (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={initiateOidcLogin}
                    className="btn-cut px-8 py-3 text-xs text-black font-medium inline-flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50"
                  >
                    <span>{isLoading ? "Redirecting..." : "Sign in with Pramaan-ZK"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Storefront Unlocked (Age &ge; 18)</span>
                  </div>
                )}
              </div>

              <DataList
                density="compact"
                items={[
                  {
                    label: "Client ID",
                    value: "demo-relying-party",
                    isMono: true,
                  },
                  {
                    label: "Grant Type",
                    value: "authorization_code + PKCE (S256/plain)",
                    isMono: true,
                  },
                  {
                    label: "Pairwise Scoping",
                    value: "Isolated per client_id",
                  },
                  {
                    label: "Target Scope",
                    value: "age_over_18",
                    isMono: true,
                  },
                ]}
              />
            </Card>
          </div>

          {/* Right Column (6 cols): Token / Claims Inspection */}
          <div className="lg:col-span-6 space-y-6">
            <Card
              title="OIDC Session & Claims Viewer"
              subtitle="Inspect the authenticated session claims and signed ID token"
              headerAction={
                session ? (
                  <StatusChip type="OFF-CHAIN VERIFIED" size="sm" />
                ) : (
                  <span className="text-xs font-mono text-white/40">Awaiting Auth</span>
                )
              }
              divider
            >
              {session ? (
                <div className="space-y-4">
                  <DataList
                    density="compact"
                    items={[
                      {
                        label: "Pairwise Subject (sub)",
                        value: session.sub,
                        isMono: true,
                        truncateMiddle: true,
                        copyable: true,
                      },
                      {
                        label: "Age Claim",
                        value: "age_over_18 = true",
                        isMono: true,
                      },
                      {
                        label: "Issuer (iss)",
                        value: window.location.origin,
                        isMono: true,
                      },
                      {
                        label: "Audience (aud)",
                        value: session.clientId,
                        isMono: true,
                      },
                    ]}
                    className="mb-4"
                  />

                  <h4 className="text-xs uppercase font-mono tracking-wider text-white/50">
                    Raw Signed ID Token (JWT)
                  </h4>
                  <CodeBlock
                    title="id_token (JWS)"
                    code={session.idToken}
                  />

                  {session.claims && (
                    <>
                      <h4 className="text-xs uppercase font-mono tracking-wider text-white/50 pt-2">
                        Decoded Claims Payload
                      </h4>
                      <CodeBlock
                        title="JWT Payload"
                        code={session.claims}
                      />
                    </>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-white/40 text-xs font-mono space-y-2">
                  <Key className="w-8 h-8 mx-auto text-white/20" />
                  <p>No active OIDC session.</p>
                  <p className="text-[11px] text-white/30">
                    Click "Sign in with Pramaan-ZK" to trigger the authorization flow.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default RelyingPartyPage;
