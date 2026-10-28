import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
import { PortalEngine, ChapterId, ChapterData } from "./PortalEngine";
import { useWallet } from "../context/WalletContext";
import "./landing.css";

export const LandingWalkthrough: React.FC = () => {
  const navigate = useNavigate();
  const { targetNetwork } = useWallet();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const portalBtnRef = useRef<HTMLButtonElement | null>(null);
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
  const [isSwitchingMenu, setIsSwitchingMenu] = useState<boolean>(false);

  // Cursor state
  const mousePos = useRef({ x: -100, y: -100 });
  const orbitPos = useRef({ x: -100, y: -100 });
  const [isCursorEnter, setIsCursorEnter] = useState<boolean>(false);
  const [isCursorVisible, setIsCursorVisible] = useState<boolean>(false);

  // Chapters Definition
  const chapters: Record<ChapterId, ChapterData> = {
    credential: {
      id: "credential",
      number: "[01]",
      name: "CREDENTIAL",
      nextNumber: "[02]",
      nextName: "Proof",
      facts: [
        ["Input:", "Synthetic demo credential (labelled DEMO / SYNTHETIC)"],
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
        ["Statement:", "Age >= 18, issuer registered on-chain"],
        ["Prover:", "SnarkJS Web Worker in your browser"],
        ["Reveals:", "Nullifier hash + 7 public signals only"],
        ["Setup:", "DEV-ONLY Groth16 ceremony (5,014 constraints)"],
      ],
    },
    verified: {
      id: "verified",
      number: "[03]",
      name: "VERIFIED",
      nextNumber: "[--]",
      nextName: "Terminal",
      facts: [
        ["Check:", "Groth16 verifier contract on MST Blockchain"],
        ["Network:", `${targetNetwork?.name || "MST Coral Testnet"} (Chain ${targetNetwork?.chainId || 54635})`],
        ["Evidence:", "Mined receipt and state check at /verify/:tx"],
        ["Not claimed:", "Government/UIDAI endorsement or real identity"],
      ],
    },
  };

  const activeData = chapters[currentChapter];

  // 1. Preloader sequence
  useEffect(() => {
    if (shouldSkipPreload) return;

    let currentVal = 0;
    const interval = setInterval(() => {
      currentVal += 5;
      if (currentVal >= 100) {
        currentVal = 100;
        setPreloadCount(100);
        clearInterval(interval);

        // Sequence after 100%
        setTimeout(() => {
          setIsDocked(true); // Logo glides to top-left header slot
        }, 300);

        setTimeout(() => {
          setIsPreloading(false);
          setIsIntroReady(true);
          setIsMaskRevealing(true);
        }, 750);

        setTimeout(() => {
          setIsContentRevealing(true);
        }, 1100);

        setTimeout(() => {
          setIsSettled(true);
        }, 2200);
      } else {
        setPreloadCount(currentVal);
      }
    }, 45);

    return () => clearInterval(interval);
  }, []);

  // 2. Initialize PortalEngine
  useEffect(() => {
    if (!canvasRef.current || !portalBtnRef.current) return;

    const engine = new PortalEngine(canvasRef.current, portalBtnRef.current, {
      onChapterCommit: (nextChapter) => {
        setCurrentChapter(nextChapter);
        setIsSwitchingMenu(true);
        setTimeout(() => setIsSwitchingMenu(false), 600);
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
        }, 150);
      },
    });

    if (initialChapter !== "credential") {
      engine.setChapter(initialChapter);
    }

    engineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, []);

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
          isCursorEnter ? "scale(1.18)" : "scale(1)"
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
      // Terminal: clicking does nothing on landing walkthrough
      return;
    }
    if (engineRef.current) {
      await engineRef.current.travel();
    }
  };

  const sidebarLabels = [
    { id: "credential", label: "Credential", isChapter: true },
    { id: "proof", label: "Proof", isChapter: true },
    { id: "verified", label: "Verify", isChapter: true },
    { id: "registry", label: "Registry", href: "/dapp" },
    { id: "channels", label: "Channels", href: "/relying-party" },
  ];

  return (
    <main
      className={`experience ${isIntroReady ? "intro-ready" : ""} ${
        isTransitioning ? "is-transitioning" : ""
      } ${isContentRevealing ? "content-revealing" : ""} ${
        isMaskRevealing ? "mask-revealing" : ""
      }`}
      data-chapter={currentChapter}
    >
      {/* 3D Portal Canvas */}
      <canvas ref={canvasRef} className="portal-canvas" aria-hidden="true" />

      {/* Screen Shade (linear gradient bottom 48%) */}
      <div className="shade" aria-hidden="true" />

      {/* 1. Header (Chrome) */}
      <header className="header chrome">
        <Link to="/" className="brand-slot">
          {/* Logo docking target slot */}
          <div className="w-[37px] h-[36px]" />
          <span className={`brand-name ${isDocked ? "is-visible" : ""}`}>
            Pramaan<span className="text-[#35f0c8]">-ZK</span>
          </span>
        </Link>

        <div className="header-actions">
          <nav className="nav" aria-label="Primary navigation">
            <Link to="/" className="active">
              About
            </Link>
            <Link to="/prove">Prove</Link>
            <Link to="/verify">Verify</Link>
            <a href="https://github.com/Shantanu112-bd/Zentity" target="_blank" rel="noreferrer">
              Docs
            </a>
          </nav>

          <Link to="/prove" className="menu-btn">
            <span>Launch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. Sidebar (Chrome) */}
      <aside className="planet-list chrome" aria-label="Walkthrough Chapters">
        <ul className={`space-y-1.5 ${isSwitchingMenu ? "is-switching" : ""}`}>
          {sidebarLabels.map((item) => {
            const isActive = item.id === currentChapter;
            return (
              <li key={item.id}>
                {item.isChapter ? (
                  <span
                    className={`planet-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      if (!isActive && item.id !== "verified" && engineRef.current) {
                        handlePortalClick();
                      }
                    }}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link to={item.href || "#"} className="planet-item opacity-60 hover:opacity-100">
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
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
          type="button"
          onClick={handlePortalClick}
          onMouseEnter={() => setIsCursorEnter(true)}
          onMouseLeave={() => setIsCursorEnter(false)}
          className="portal"
          aria-label={
            currentChapter === "verified"
              ? "Walkthrough completed at Verified state"
              : `Proceed to next chapter: ${activeData.nextName}`
          }
        />
      </section>

      {/* 4. Giant Title & Fact Sheet (Chrome) */}
      <section className="planet-content chrome" aria-live="polite">
        <h1 id="planet-title">{activeData.name}</h1>

        <dl id="facts">
          {activeData.facts.map(([key, val], idx) => (
            <div key={idx} className="fact">
              <dt>{key}</dt>
              <dd>{val}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 5. Preloader Choreography */}
      {isPreloading && (
        <div className={`preloader ${preloadCount === 100 ? "is-done" : ""}`}>
          <div className="w-full h-full bg-[#06080b]" />
        </div>
      )}

      {/* Floating Logo (flies from dead-center to header slot over 2s) */}
      <img
        src="/brand/logo.svg"
        alt="Pramaan-ZK"
        className={`floating-logo ${isDocked ? "is-docked" : ""} ${isSettled ? "is-settled" : ""}`}
      />

      {/* Preloader Counter */}
      {isPreloading && (
        <div className={`preloader-count ${preloadCount === 100 ? "is-leaving" : ""}`} aria-live="polite">
          <span>{preloadCount}</span>
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
        <span ref={cursorOrbitRef} className="cursor-orbit">
          <span className="cursor-label">Enter</span>
        </span>
      </div>
    </main>
  );
};
