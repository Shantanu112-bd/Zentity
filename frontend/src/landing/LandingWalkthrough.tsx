/**
 * frontend/src/landing/LandingWalkthrough.tsx
 * 
 * Cinematic Proof-Gate Landing Experience
 * Strictly aligned with reference specifications
 * for the Pramaan-ZK privacy protocol.
 */

import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { PortalEngine, ChapterId, ChapterData } from "./PortalEngine";
import { useWallet } from "../context/WalletContext";
import "./landing.css";

export const LandingWalkthrough: React.FC = () => {
  const navigate = useNavigate();
  const { targetNetwork } = useWallet();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const portalBtnRef = useRef<HTMLButtonElement | null>(null);
  const planetListRef = useRef<HTMLElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorDotRef = useRef<HTMLSpanElement | null>(null);
  const cursorOrbitRef = useRef<HTMLSpanElement | null>(null);
  const engineRef = useRef<PortalEngine | null>(null);

  // URL query params for testing / direct chapter jump
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const paramChapter = searchParams.get("chapter") as ChapterId | null;
  const initialChapter: ChapterId =
    paramChapter && ["credential", "proof", "verified"].includes(paramChapter)
      ? paramChapter
      : "credential";
  const shouldSkipPreload = searchParams.get("skipPreloader") === "true";

  // Experience state
  const [currentChapter, setCurrentChapter] = useState<ChapterId>(initialChapter);
  const [isPreloading, setIsPreloading] = useState<boolean>(!shouldSkipPreload);
  const [preloadCount, setPreloadCount] = useState<number>(shouldSkipPreload ? 100 : 0);
  const [isDocked, setIsDocked] = useState<boolean>(shouldSkipPreload);
  const [isSettled, setIsSettled] = useState<boolean>(shouldSkipPreload);
  const [isIntroReady, setIsIntroReady] = useState<boolean>(shouldSkipPreload);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isContentRevealing, setIsContentRevealing] = useState<boolean>(shouldSkipPreload);
  const [isMaskRevealing, setIsMaskRevealing] = useState<boolean>(shouldSkipPreload);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Cursor state
  const mousePos = useRef({ x: -100, y: -100 });
  const orbitPos = useRef({ x: -100, y: -100 });
  const [isCursorEnter, setIsCursorEnter] = useState<boolean>(false);
  const [isCursorVisible, setIsCursorVisible] = useState<boolean>(false);

  // 8-Row Sidebar Mapping per §2
  const sidebarItems = [
    { id: "credential", label: "Credential", isChapter: true },
    { id: "proof", label: "Proof", isChapter: true },
    { id: "verified", label: "Verified", isChapter: true },
    { id: "registry", label: "Registry", href: "/app/dapp" },
    { id: "relying-party", label: "Relying Party", href: "/app/relying-party" },
    { id: "dapp-gate", label: "dApp Gate", href: "/app/dapp" },
    { id: "gov-stub", label: "Gov Stub (Simulation)", href: "/app/relying-party" },
    { id: "docs", label: "Docs", href: "https://github.com/Shantanu112-bd/Zentity", external: true },
  ];

  // Chapters Definition per §2
  const chapters: Record<ChapterId, ChapterData> = {
    credential: {
      id: "credential",
      number: "[01]",
      name: "CREDENTIAL",
      nextNumber: "[02]",
      nextName: "Proof",
      facts: [
        ["Input:", "Synthetic demo credential (DEMO / SYNTHETIC)"],
        ["Signed by:", "Demo issuer, EdDSA-Poseidon curve"],
        ["Stays on:", "Your device (zero network egress verified)"],
        ["Real Aadhaar QR:", "Not supported yet (future work, Milestone M2)"],
      ],
    },
    proof: {
      id: "proof",
      number: "[02]",
      name: "PROOF",
      nextNumber: "[03]",
      nextName: "Verified",
      facts: [
        ["Statement:", "Age ≥ 18, issuer registered on-chain"],
        ["Prover:", "SnarkJS Web Worker in your browser"],
        ["Reveals:", "Nullifier hash + 7 public signals only"],
        ["Setup:", "DEV-ONLY Groth16 ceremony (5,014 constraints)"],
      ],
    },
    verified: {
      id: "verified",
      number: "[03]",
      name: "VERIFIED",
      nextNumber: "[04]",
      nextName: "Launch",
      facts: [
        ["Check:", "Groth16 verifier contract on MST Blockchain"],
        ["Network:", `${targetNetwork?.name || "MST Coral Testnet"} (${targetNetwork?.chainId || 54635})`],
        ["Evidence:", "Mined receipt and state check at /verify/:tx"],
        ["Not claimed:", "Government/UIDAI endorsement or real identity"],
      ],
    },
  };

  const activeData = chapters[currentChapter];

  // 1. Preloader sequence (~3s duration matching reference feel)
  useEffect(() => {
    if (shouldSkipPreload) {
      document.body.classList.add("preload-complete", "intro-ready");
      return;
    }

    const startTime = performance.now();
    const duration = 2800; // ~3s sequence

    const timer = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setPreloadCount(progress);

      if (progress >= 100) {
        clearInterval(timer);
        // Step 1: Counter leaves (blur-up) & logo glides to header
        setTimeout(() => {
          setIsDocked(true);
        }, 150);

        // Step 2: Preloader hides, chrome drops in
        setTimeout(() => {
          setIsPreloading(false);
          setIsIntroReady(true);
          setIsMaskRevealing(true);
          document.body.classList.add("preload-complete", "intro-ready");
        }, 750);

        // Step 3: Content reveals
        setTimeout(() => {
          setIsContentRevealing(true);
        }, 1050);

        // Step 4: Logo settles into chrome
        setTimeout(() => {
          setIsSettled(true);
        }, 2150);
      }
    }, 30);

    return () => {
      clearInterval(timer);
      document.body.classList.remove("preload-complete", "intro-ready");
    };
  }, [shouldSkipPreload]);

  // 2. Initialize PortalEngine
  useEffect(() => {
    if (!canvasRef.current || !portalBtnRef.current) return;

    const engine = new PortalEngine(canvasRef.current, portalBtnRef.current, {
      onChapterCommit: (nextChapter) => {
        setCurrentChapter(nextChapter);
        // Retrigger .is-switching on .planet-list using DOM reflow per PDF §4
        const planetList = planetListRef.current;
        if (planetList) {
          planetList.classList.remove("is-switching");
          void planetList.offsetWidth; // Force reflow
          planetList.classList.add("is-switching");
        }
      },
      onTransitionStart: () => {
        setIsTransitioning(true);
        setIsContentRevealing(false);
        setIsMaskRevealing(false);
      },
      onTransitionEnd: () => {
        setIsTransitioning(false);
        setIsMaskRevealing(true);
        setTimeout(() => {
          setIsContentRevealing(true);
        }, 100);
      },
    });

    if (initialChapter !== "credential") {
      engine.setChapter(initialChapter);
    }

    engineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, [initialChapter]);

  // 3. Custom Cursor smooth interpolation loop
  useEffect(() => {
    let animId: number;

    const updateCursor = () => {
      // Lerp orbit position by 0.2 per frame
      orbitPos.current.x += (mousePos.current.x - orbitPos.current.x) * 0.2;
      orbitPos.current.y += (mousePos.current.y - orbitPos.current.y) * 0.2;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (cursorOrbitRef.current) {
        cursorOrbitRef.current.style.transform = `translate3d(${orbitPos.current.x}px, ${orbitPos.current.y}px, 0) translate(-50%, -50%) ${
          isCursorEnter ? "scale(1.16)" : "scale(1)"
        }`;
      }

      animId = requestAnimationFrame(updateCursor);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      if (!isCursorVisible) setIsCursorVisible(true);
    };

    const handleMouseLeave = () => {
      setIsCursorVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    animId = requestAnimationFrame(updateCursor);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [isCursorEnter, isCursorVisible]);

  const handlePortalClick = async () => {
    if (currentChapter === "verified") {
      // Terminal: clicking does nothing on landing walkthrough per §2
      return;
    }
    if (engineRef.current) {
      await engineRef.current.travel();
    }
  };

  const handleLaunchApp = async () => {
    if (engineRef.current) {
      setIsTransitioning(true);
      await engineRef.current.expandAndLaunch(() => {
        navigate("/app/prove");
      });
    } else {
      navigate("/app/prove");
    }
  };

  return (
    <main
      className={`experience ${isIntroReady ? "intro-ready" : ""} ${
        isTransitioning ? "is-transitioning" : ""
      } ${isContentRevealing ? "content-revealing" : ""} ${
        isMaskRevealing ? "mask-revealing" : ""
      }`}
      data-chapter={currentChapter}
    >
      {/* Background container */}
      <div className="backgrounds" aria-hidden="true" />

      {/* 3D Portal Canvas */}
      <canvas ref={canvasRef} id="portal-canvas" className="portal-canvas" aria-hidden="true" />

      {/* Screen Shade (linear gradient bottom 48% per §5) */}
      <div className="shade" aria-hidden="true" />

      {/* 1. Header (Chrome) */}
      <header className="header chrome">
        <Link to="/" className="brand-slot" aria-label="Pramaan-ZK Home">
          {/* Logo docking target slot */}
          <div style={{ width: "37px", height: "36px" }} />
          <span className={`brand-name ${isDocked ? "is-visible" : ""}`}>
            Pramaan-ZK
          </span>
        </Link>

        <div className="header-actions">
          <nav className="nav" aria-label="Primary navigation">
            <Link to="/" className="active">
              About
            </Link>
            <Link to="/app/prove">Explore</Link>
            <button
              type="button"
              onClick={handleLaunchApp}
              className="hover:text-white transition-colors"
            >
              Launch App
            </button>
          </nav>

          <button
            type="button"
            className="menu"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open Navigation Menu"
          >
            Menu
          </button>
        </div>
      </header>

      {/* 2. Sidebar (Chrome) - 8 items per §2 & §4 */}
      <aside
        ref={planetListRef}
        className="planet-list chrome"
        aria-label="Walkthrough Chapters"
      >
        {sidebarItems.map((item) => {
          const isActive = item.id === currentChapter;
          return item.isChapter ? (
            <span
              key={item.id}
              className={`planet-item ${isActive ? "active" : ""}`}
              onClick={() => {
                if (!isActive && item.id !== "verified" && engineRef.current) {
                  handlePortalClick();
                }
              }}
            >
              {item.label}
            </span>
          ) : item.external ? (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="planet-item"
            >
              {item.label}
            </a>
          ) : (
            <Link key={item.id} to={item.href} className="planet-item">
              {item.label}
            </Link>
          );
        })}
      </aside>

      {/* 3. Portal Trigger Wrap (Chrome) */}
      <section className="portal-wrap chrome" aria-label="Next destination">
        <div className="portal-heading">
          <span>Next:</span>
          <span>
            <span id="next-number">{activeData.nextNumber}</span>{" "}
            <strong id="next-name">{activeData.nextName}</strong>
          </span>
        </div>

        <button
          ref={portalBtnRef}
          id="portal"
          type="button"
          onClick={handlePortalClick}
          onMouseEnter={() => setIsCursorEnter(true)}
          onMouseLeave={() => setIsCursorEnter(false)}
          className="portal"
          aria-label={
            currentChapter === "verified"
              ? "Terminal: Walkthrough complete"
              : `Travel to ${activeData.nextName}`
          }
        />
      </section>

      {/* 4. Giant Title & Fact Sheet (Chrome) */}
      <section className="planet-content chrome" aria-live="polite">
        <h1 id="planet-title">{activeData.name}</h1>

        <div>
          <dl id="facts">
            {activeData.facts.map(([key, val], idx) => (
              <div key={idx} className="fact">
                <dt>{key}</dt>
                <dd>{val}</dd>
              </div>
            ))}
          </dl>

          {/* White .menu-style CTA pill on terminal chapter per §2 */}
          {currentChapter === "verified" && (
            <div className="fact-cta">
              <button
                type="button"
                onClick={handleLaunchApp}
                className="menu"
                style={{ marginTop: "16px", gap: "8px" }}
              >
                <span>Launch App</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 5. Preloader Sequence (PDF §6) */}
      {isPreloading && (
        <div
          id="preloader"
          className={`preloader ${preloadCount === 100 ? "is-background" : ""}`}
          aria-label="Loading Experience"
        >
          <div className="preloader-shade" />
        </div>
      )}

      {/* Floating Logo (glides from screen centre to header slot over 2s) */}
      <img
        id="floating-logo"
        src="/brand/logo.svg"
        alt="Pramaan-ZK"
        className={`floating-logo ${isDocked ? "is-docked" : ""} ${isSettled ? "is-settled" : ""}`}
      />

      {/* Preloader Counter */}
      {isPreloading && (
        <div
          id="preloader-count"
          className={`preloader-count ${preloadCount === 100 ? "is-leaving" : ""}`}
          aria-live="polite"
        >
          <span id="preloader-value">{preloadCount}</span>
          <span className="percent">%</span>
        </div>
      )}

      {/* 6. Custom Cursor (only on fine pointer / desktop) */}
      <div
        ref={cursorRef}
        className={`custom-cursor ${isCursorVisible ? "is-visible" : ""} ${isCursorEnter ? "is-enter" : ""}`}
        aria-hidden="true"
      >
        <span ref={cursorDotRef} className="cursor-dot" />
        <span ref={cursorOrbitRef} className="cursor-orbit" />
        <span className="cursor-label">Enter</span>
      </div>

      {/* 7. Menu Overlay per §2 */}
      <div className={`menu-overlay ${isMenuOpen ? "is-open" : ""}`}>
        <div className="menu-overlay-header">
          <span className="brand-name is-visible">Pramaan-ZK Menu</span>
          <button
            type="button"
            className="menu"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close Menu"
          >
            <X className="w-4 h-4 mr-2" />
            <span>Close</span>
          </button>
        </div>
        <div className="menu-overlay-nav">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="menu-overlay-link"
          >
            <span className="num">[01]</span> About & Overview
          </Link>
          <Link
            to="/app/prove"
            onClick={() => setIsMenuOpen(false)}
            className="menu-overlay-link"
          >
            <span className="num">[02]</span> Generate Proof
          </Link>
          <Link
            to="/app/verify"
            onClick={() => setIsMenuOpen(false)}
            className="menu-overlay-link"
          >
            <span className="num">[03]</span> Verify On-Chain
          </Link>
          <Link
            to="/app/dapp"
            onClick={() => setIsMenuOpen(false)}
            className="menu-overlay-link"
          >
            <span className="num">[04]</span> dApp Gate & Registry
          </Link>
          <Link
            to="/app/relying-party"
            onClick={() => setIsMenuOpen(false)}
            className="menu-overlay-link"
          >
            <span className="num">[05]</span> Relying Party OIDC
          </Link>
          <a
            href="https://github.com/Shantanu112-bd/Zentity"
            target="_blank"
            rel="noreferrer"
            className="menu-overlay-link"
          >
            <span className="num">[06]</span> Documentation
          </a>
        </div>
      </div>
    </main>
  );
};
