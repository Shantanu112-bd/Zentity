import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { LandingPage } from "./pages/LandingPage";
import { ProvePage } from "./pages/ProvePage";
import { VerifyPage } from "./pages/VerifyPage";
import { RelyingPartyPage } from "./pages/RelyingPartyPage";
import { DappGatePage } from "./pages/DappGatePage";

export const App: React.FC = () => {
  return (
    <WalletProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#08090d] text-slate-100">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/prove" element={<ProvePage />} />
              <Route path="/verify/:tx" element={<VerifyPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/relying-party" element={<RelyingPartyPage />} />
              <Route path="/dapp" element={<DappGatePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </WalletProvider>
  );
};

export default App;
