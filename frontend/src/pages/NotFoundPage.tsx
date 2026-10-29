/**
 * frontend/src/pages/NotFoundPage.tsx
 * 
 * 404 Route Not Found Page in Pramaan-ZK Layout Shell
 */

import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Home, FileQuestion } from "lucide-react";
import { PageShell, EmptyState, PageHeader } from "../components/layout";

export const NotFoundPage: React.FC = () => {
  return (
    <PageShell>
      <PageHeader
        eyebrow="HTTP 404 Error"
        title="Page Not Found"
        description="The URL requested does not exist or has been moved within the application."
      />

      <div className="flex-1 flex items-center justify-center py-12">
        <EmptyState
          icon={FileQuestion}
          title="404 — Route Not Found"
          description="We couldn't locate the specified page. You can return to the portal landing page or launch the client-side attribute prover."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/"
                className="btn-cut px-6 py-2.5 min-h-[44px] text-xs text-black font-medium inline-flex items-center gap-2 hover:bg-white/90"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Landing</span>
              </Link>

              <Link
                to="/app/prove"
                className="btn-cut-border px-5 py-2.5 min-h-[44px] text-xs text-white inline-flex items-center gap-2 hover:bg-white/5"
              >
                <span>Launch Prover</span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </Link>
            </div>
          }
        />
      </div>
    </PageShell>
  );
};

export default NotFoundPage;
