import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { LandingPage } from "./pages/LandingPage";
import { ProvePage } from "./pages/ProvePage";
import { VerifyPage } from "./pages/VerifyPage";
import { RelyingPartyPage } from "./pages/RelyingPartyPage";
import { DappGatePage } from "./pages/DappGatePage";

export const App: React.FC = () => {
  return (
    <WalletProvider>
      <Router>
        <Routes>
          {/* Landing Walkthrough */}
          <Route path="/" element={<LandingPage />} />

          {/* Working App Shell Routes */}
          <Route path="/app/prove" element={<ProvePage />} />
          <Route path="/app/verify/:tx" element={<VerifyPage />} />
          <Route path="/app/verify" element={<VerifyPage />} />
          <Route path="/app/relying-party" element={<RelyingPartyPage />} />
          <Route path="/app/dapp" element={<DappGatePage />} />
          <Route path="/app/registry" element={<DappGatePage />} />

          {/* Legacy / Direct Route Compatibility (Redirects or Direct Mount) */}
          <Route path="/prove" element={<ProvePage />} />
          <Route path="/verify/:tx" element={<VerifyPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/relying-party" element={<RelyingPartyPage />} />
          <Route path="/dapp" element={<DappGatePage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </WalletProvider>
  );
};

export default App;
