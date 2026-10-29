/**
 * frontend/src/pages/NotFoundPage.tsx
 * 
 * 404 Not Found Page in Pramaan-ZK Redesign Aesthetic
 */

import React from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { ArrowLeft, Home } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <AppShell title="404 NOT FOUND">
      <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
        <span className="text-6xl sm:text-7xl font-mono font-light text-white/20 mb-4">404</span>
        <h2 className="text-xl sm:text-2xl font-normal text-white mb-2">Page Not Found</h2>
        <p className="text-xs sm:text-sm text-white/50 max-w-md mb-8">
          The requested route does not exist or has moved. Return to the application landing page or access the prover.
        </p>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="btn-cut px-6 py-3 bg-white text-black text-xs font-medium hover:bg-white/90 inline-flex items-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Landing Portal</span>
          </Link>
          <Link
            to="/app/prove"
            className="btn-cut-border px-5 py-3 text-white text-xs font-medium hover:bg-white/10 inline-flex items-center gap-2"
          >
            <span>Launch Prover</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </div>
    </AppShell>
  );
};

export default NotFoundPage;
