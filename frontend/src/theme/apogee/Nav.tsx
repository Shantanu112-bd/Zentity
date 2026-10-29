/**
 * frontend/src/theme/apogee/Nav.tsx
 * 
 * Global Navigation Header for Apogee Design System
 * - Max width 1800px, px-5 sm:px-8 md:px-[82px]
 * - Center pill navigation with backdrop-blur-[17px]
 * - Right action pill with wallet integration and primary CTA
 * - Animated cross-fading hamburger toggle and mobile drawer
 */

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { Animate } from "./Animate";
import { useWallet } from "../../context/WalletContext";

export interface NavProps {
  onLogin?: () => void;
  onBookDemo?: () => void;
}

export function Nav({ onLogin, onBookDemo }: NavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const {
    address,
    isConnected,
    isConnecting,
    targetNetwork,
    isCorrectNetwork,
    connect,
    disconnect,
    switchNetwork,
  } = useWallet();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Connect Wallet";

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navLinks = [
    { label: "Prove", to: "/app/prove" },
    { label: "Verify", to: "/app/verify" },
    { label: "Registry", to: "/app/dapp" },
    { label: "Relying Party", to: "/app/relying-party" },
  ];

  return (
    <>
      <nav className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] pt-[20px] sm:pt-[30px] flex items-center justify-between relative z-50">
        {/* Brand / Logo */}
        <Animate delay={0} direction="down">
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer group focus:outline-none">
            <svg
              width="28"
              height="28"
              viewBox="0 0 256 256"
              fill="none"
              className="sm:w-[32px] sm:h-[32px] group-hover:scale-105 transition-transform"
            >
              <path
                d="M 256 256 L 178 256 C 150.386 256 128 233.614 128 206 L 128 256 L 0 256 L 0 192 C 0 156.654 28.654 128 64 128 C 99.346 128 128 156.654 128 192 L 128 128 L 256 128 Z M 78 0 C 105.614 0 128 22.386 128 50 L 128 0 L 256 0 L 256 64 C 256 99.346 227.346 128 192 128 C 156.654 128 128 99.346 128 64 L 128 128 L 0 128 L 0 0 Z"
                fill="white"
              />
            </svg>
            <div className="flex flex-col">
              <span className="text-white text-[22px] sm:text-[26px] font-[450] leading-none tracking-[-0.02em]">
                Apogee
              </span>
              <span className="text-white/40 text-[9px] tracking-widest font-mono mt-0.5">
                PRAMAAN-ZK
              </span>
            </div>
          </Link>
        </Animate>

        {/* Center Desktop Navigation Pill */}
        <Animate className="hidden lg:block" delay={100} direction="down">
          <div className="h-[52px] px-6 flex items-center gap-[30px] bg-[rgba(10,7,7,0.35)] rounded-[11px] backdrop-blur-[17px] border border-white/[0.04]">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-[14px] font-[450] leading-[14px] transition-colors ${
                    isActive ? "text-white font-medium" : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href="https://github.com/Shantanu112-bd/Zentity"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-[5px] text-white/80 text-[14px] font-[450] leading-[14px] hover:text-white transition-colors"
            >
              Resources
              <ChevronDown className="w-[10px] h-[10px] opacity-80" />
            </a>
          </div>
        </Animate>

        {/* Right Desktop Auth / Action Pill */}
        <Animate className="hidden lg:block" delay={200} direction="down">
          <div className="h-[52px] p-[3px] bg-[rgba(0,0,0,0.35)] rounded-[13px] backdrop-blur-[17px] border border-white/[0.04] flex items-center gap-[5px]">
            {/* Live Network Indicator */}
            <span
              data-testid="network-chip"
              className="px-3 py-1.5 text-[11px] font-mono tracking-wider rounded-[9px] bg-white/5 text-white/70"
            >
              {targetNetwork.name}
            </span>

            {/* Wallet Button */}
            {isConnected && address ? (
              <button
                type="button"
                onClick={disconnect}
                data-testid="wallet-connect-btn"
                className="h-[46px] px-5 rounded-[11px] text-white text-[13px] font-mono font-[450] leading-[14px] hover:bg-white/5 transition-colors"
                title="Click to disconnect"
              >
                {shortAddress}
              </button>
            ) : (
              <button
                type="button"
                onClick={connect}
                disabled={isConnecting}
                data-testid="wallet-connect-btn"
                className="h-[46px] px-5 rounded-[11px] text-white text-[14px] font-[450] leading-[14px] hover:bg-white/5 transition-colors"
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </button>
            )}

            {/* Primary Action Button */}
            <Link
              to="/app/prove"
              onClick={onBookDemo}
              className="h-[46px] px-6 bg-[#E9E9E9] rounded-[11px] text-[#0A0707] text-[14px] font-[450] leading-[14px] hover:bg-white transition-colors inline-flex items-center justify-center font-medium"
            >
              Launch App
            </Link>
          </div>
        </Animate>

        {/* Mobile Hamburger Toggle */}
        <Animate className="lg:hidden" delay={100} direction="down">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            className="w-[44px] h-[44px] flex items-center justify-center rounded-[11px] bg-[rgba(10,7,7,0.35)] backdrop-blur-[17px] border border-white/[0.06] transition-colors hover:bg-white/10"
          >
            <div className="relative w-5 h-5">
              <Menu
                className={`w-5 h-5 text-white absolute inset-0 transition-all duration-300 ease-out ${
                  isOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                }`}
              />
              <X
                className={`w-5 h-5 text-white absolute inset-0 transition-all duration-300 ease-out ${
                  isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                }`}
              />
            </div>
          </button>
        </Animate>
      </nav>

      {/* Mobile Drawer (Always Mounted for Bidirectional Transition) */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? "visible" : "invisible"
        }`}
      >
        <div
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-[#080A19]/90 backdrop-blur-[24px] transition-opacity duration-500 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute top-[76px] sm:top-[86px] left-4 right-4 sm:left-6 sm:right-6 bg-[rgba(17,16,15,0.6)] backdrop-blur-[30px] rounded-[20px] border border-white/[0.06] p-6 sm:p-8 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] origin-top shadow-2xl ${
            isOpen
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-4 scale-[0.97]"
          }`}
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((item, idx) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-[12px] text-white/90 text-[17px] font-[450] hover:bg-white/[0.06] transition-all duration-300 ${
                  isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
                }`}
                style={{ transitionDelay: isOpen ? `${100 + idx * 50}ms` : "0ms" }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="h-px bg-white/10 my-4" />

          {/* Network & Wallet Controls in Mobile Drawer */}
          <div
            className={`flex flex-col gap-3 transition-all duration-300 ${
              isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
            style={{ transitionDelay: isOpen ? "350ms" : "0ms" }}
          >
            <div className="flex items-center justify-between px-2 text-xs text-white/60">
              <span>Target Network:</span>
              <span className="font-mono text-white/90">{targetNetwork.name} ({targetNetwork.chainId})</span>
            </div>

            <Link
              to="/app/prove"
              onClick={() => setIsOpen(false)}
              className="w-full h-[50px] bg-[#E9E9E9] rounded-[12px] text-[#0A0707] text-[15px] font-[450] transition-colors hover:bg-white flex items-center justify-center font-medium"
            >
              Launch Prover
            </Link>

            {isConnected && address ? (
              <button
                type="button"
                onClick={() => {
                  disconnect();
                  setIsOpen(false);
                }}
                className="w-full h-[50px] rounded-[12px] border border-white/30 text-white text-[15px] font-mono font-[450] transition-colors hover:bg-white/5"
              >
                Disconnect ({shortAddress})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  connect();
                  setIsOpen(false);
                }}
                className="w-full h-[50px] rounded-[12px] border border-white/30 text-white text-[15px] font-[450] transition-colors hover:bg-white/5"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Nav;

