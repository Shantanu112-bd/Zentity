/**
 * frontend/src/pages/SimulationPage.tsx
 * 
 * Government Simulation Stub Portal
 * Strictly adheres to ANTIGRAVITY_APP_UI_REFINEMENT_PROMPT.md Step C.5:
 * - Prominent "SIMULATION — NOT A GOVERNMENT INTEGRATION" banner
 * - Request and response payload viewer in CodeBlocks
 * - Clear disclosure of synthetic testing harness
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Send,
  Loader2,
  Database,
  ArrowLeft,
  Server,
  Key,
} from "lucide-react";
import { StatusChip } from "../components/StatusChip";
import {
  PageShell,
  PageHeader,
  Card,
  CodeBlock,
  StatusBanner,
  DataList,
  Field,
} from "../components/layout";

export const SimulationPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [requestEvent, setRequestEvent] = useState("credential.revocation_check");
  const [responsePayload, setResponsePayload] = useState<any | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTriggerWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/simulation/government/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Simulation-Event": requestEvent,
        },
        body: JSON.stringify({
          event: requestEvent,
          timestamp: new Date().toISOString(),
          syntheticFixtureId: "synthetic-uid-demo-001",
        }),
      });

      const data = await res.json();
      setResponsePayload(data);
      setResponseHeaders({
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get("content-type"),
      });
    } catch (err: any) {
      console.error("Simulation request failed:", err);
      setErrorMsg(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Development Fixture Channel"
        title="Government Simulation Stub"
        description="Local simulation stub mimicking external verifier webhook callbacks. Used exclusively for hermetic offline test validation."
        rightSlot={
          <div className="flex items-center gap-2">
            <StatusChip type="SIMULATED" size="sm" />
            <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-mono rounded border border-white/20 bg-white/5 text-white/70">
              Zero-PII Stub
            </span>
          </div>
        }
      />

      <div className="space-y-6 pb-12">
        {/* Prominent Mandatory Non-Government Notice */}
        <StatusBanner
          variant="warning"
          title="SIMULATION — NOT A GOVERNMENT INTEGRATION"
          description="Pramaan-ZK is strictly an independent cryptographic research and zero-knowledge protocol demonstrator. It has no integration, partnership, affiliation, or approval with UIDAI or any government agency."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (5 cols): Trigger Form */}
          <div className="lg:col-span-5 space-y-6">
            <Card
              title="Webhook Simulator"
              subtitle="Trigger simulated institutional verification callback"
              headerAction={<Server className="w-4 h-4 text-white/50" />}
              divider
            >
              <form onSubmit={handleTriggerWebhook} className="space-y-4 mb-6">
                <Field
                  label="Simulated Event Type"
                  value={requestEvent}
                  onChange={(e) => setRequestEvent(e.target.value)}
                  helperText="Endpoint: POST /api/simulation/government/webhook"
                />

                <div className="text-xs uppercase font-mono tracking-wider text-white/50 pt-1">
                  Synthetic Fixture Spec
                </div>
                <DataList
                  density="compact"
                  items={[
                    {
                      label: "Harness Type",
                      value: "HMAC-SHA256 Mock Webhook",
                      isMono: true,
                    },
                    {
                      label: "Secret Key",
                      value: "simulation-secret-not-real-government",
                      isMono: true,
                      truncateMiddle: true,
                    },
                    {
                      label: "Target Environment",
                      value: "Local Hermetic Sandbox",
                    },
                  ]}
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-cut w-full py-3 text-xs text-black font-medium inline-flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting Payload...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Simulated Webhook</span>
                    </>
                  )}
                </button>
              </form>

              {errorMsg && (
                <StatusBanner
                  variant="error"
                  title="Simulation Call Failed"
                  description={errorMsg}
                />
              )}
            </Card>
          </div>

          {/* Right Column (7 cols): Payload Inspector */}
          <div className="lg:col-span-7 space-y-6">
            <Card
              title="Payload & Signature Inspector"
              subtitle="Examine mock cryptographic webhook response data"
              headerAction={
                responsePayload ? (
                  <StatusChip type="LOCAL VERIFIED" size="sm" />
                ) : (
                  <span className="text-xs font-mono text-white/40">Ready to Trigger</span>
                )
              }
              divider
            >
              {responsePayload ? (
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-mono tracking-wider text-white/50">
                    Response Headers & Status
                  </h4>
                  <CodeBlock
                    title="HTTP Response"
                    code={responseHeaders}
                  />

                  <h4 className="text-xs uppercase font-mono tracking-wider text-white/50 pt-2">
                    Simulated Response Payload
                  </h4>
                  <CodeBlock
                    title="Response Body"
                    code={responsePayload}
                  />
                </div>
              ) : (
                <div className="py-12 text-center text-white/40 text-xs font-mono space-y-2">
                  <Key className="w-8 h-8 mx-auto text-white/20" />
                  <p>No webhook payload dispatched yet.</p>
                  <p className="text-[11px] text-white/30">
                    Click "Send Simulated Webhook" to trigger the local Fastify simulation route.
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

export default SimulationPage;
