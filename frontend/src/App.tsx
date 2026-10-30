/**
 * frontend/src/App.tsx
 * 
 * Cinematic Liquid-Glass Hero & Connected Workspace
 */

import React, { useState } from "react";
import {
  Play,
  Info,
  Search,
  User,
  Star,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { AppWorkspace } from "./components/AppWorkspace";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4";

export default function App() {
  const [view, setView] = useState<"landing" | "app">("landing");

  if (view === "app") {
    return <AppWorkspace onBackToLanding={() => setView("landing")} />;
  }

  const enterApp = () => setView("app");

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans select-none">
      {/* 1. Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0"
        src={VIDEO_URL}
      />

      {/* 2. Bottom Blur Overlay (No black gradient, CSS mask with backdrop-blur-24) */}
      <div className="fixed inset-0 bottom-blur-mask pointer-events-none z-1" />

      {/* 3. Hero Layer & Navigation */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-10 pointer-events-auto">
        {/* Top Navigation */}
        <header className="w-full flex items-center justify-between">
          {/* Logo */}
          <div
            className="animate-blur-fade-up flex items-center gap-2 cursor-pointer"
            style={{ animationDelay: "0ms" }}
            onClick={enterApp}
          >
            <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center liquid-glass">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold tracking-widest text-sm uppercase">Pramaan-ZK</span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-wider text-white/70">
            <button
              type="button"
              onClick={enterApp}
              className="animate-blur-fade-up hover:text-white transition-colors flex items-center gap-1.5"
              style={{ animationDelay: "100ms" }}
            >
              <span className="text-[10px] text-white/40 font-mono">01</span>
              <span>Movies</span>
            </button>
            <button
              type="button"
              onClick={enterApp}
              className="animate-blur-fade-up hover:text-white transition-colors flex items-center gap-1.5"
              style={{ animationDelay: "150ms" }}
            >
              <span className="text-[10px] text-white/40 font-mono">02</span>
              <span>TV Series</span>
            </button>
            <button
              type="button"
              onClick={enterApp}
              className="animate-blur-fade-up hover:text-white transition-colors flex items-center gap-1.5"
              style={{ animationDelay: "200ms" }}
            >
              <span className="text-[10px] text-white/40 font-mono">03</span>
              <span>Editor's Pick</span>
            </button>
            <button
              type="button"
              onClick={enterApp}
              className="animate-blur-fade-up hover:text-white transition-colors flex items-center gap-1.5"
              style={{ animationDelay: "250ms" }}
            >
              <span className="text-[10px] text-white/40 font-mono">04</span>
              <span>Interviews</span>
            </button>
            <button
              type="button"
              onClick={enterApp}
              className="animate-blur-fade-up hover:text-white transition-colors flex items-center gap-1.5"
              style={{ animationDelay: "300ms" }}
            >
              <span className="text-[10px] text-white/40 font-mono">05</span>
              <span>User Reviews</span>
            </button>
          </nav>

          {/* Search & User */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={enterApp}
              className="animate-blur-fade-up liquid-glass w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ animationDelay: "350ms" }}
              title="Search and Open Workspace"
            >
              <Search size={15} />
            </button>
            <button
              type="button"
              onClick={enterApp}
              className="animate-blur-fade-up liquid-glass w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ animationDelay: "400ms" }}
              title="Open Workspace"
            >
              <User size={15} />
            </button>
          </div>
        </header>

        {/* Bottom Hero Content */}
        <div className="w-full flex flex-col md:flex-row items-end justify-between gap-8 pb-4">
          <div className="max-w-2xl space-y-4">
            {/* Metadata Row */}
            <div
              className="animate-blur-fade-up flex items-center gap-3 text-xs text-white/80 font-medium"
              style={{ animationDelay: "300ms" }}
            >
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-white text-white" />
                <span>8.7/10 IMDB</span>
              </div>
              <span className="text-white/40">•</span>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>132 min</span>
              </div>
              <span className="text-white/40">•</span>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>April, 2025</span>
              </div>
            </div>

            {/* Headline */}
            <h1
              className="animate-blur-fade-up text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-none text-white"
              style={{ animationDelay: "400ms" }}
            >
              Step Through. Work Smarter.
            </h1>

            {/* Subhead */}
            <p
              className="animate-blur-fade-up text-sm sm:text-base text-white/70 max-w-xl font-normal leading-relaxed"
              style={{ animationDelay: "500ms" }}
            >
              A voyage through forgotten realms, where past and future intertwine.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={enterApp}
                className="animate-blur-fade-up liquid-glass px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{ animationDelay: "600ms" }}
              >
                <Play size={14} className="fill-white" />
                <span>Watch Now</span>
              </button>

              <button
                type="button"
                onClick={enterApp}
                className="animate-blur-fade-up liquid-glass px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{ animationDelay: "700ms" }}
              >
                <Info size={14} />
                <span>Learn More</span>
              </button>
            </div>
          </div>

          {/* Prev / Next Navigation Pills */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={enterApp}
              className="animate-blur-fade-up liquid-glass w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ animationDelay: "800ms" }}
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={enterApp}
              className="animate-blur-fade-up liquid-glass w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ animationDelay: "900ms" }}
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
