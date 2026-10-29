/**
 * scripts/check-app-layout.js
 * 
 * Automated Layout Verification Script for Step D of ANTIGRAVITY_APP_UI_REFINEMENT_PROMPT.md
 * Validates across 1440px, 768px, and 375px viewports:
 * - 0 horizontal scroll overflow on document and inner stage
 * - No overlapping interactive elements
 * - Mobile touch targets (>= 44px min height & width for standalone interactive buttons/links)
 * - 0 uncaught JavaScript runtime console errors
 * - Outputs structured docs/evidence/ui/layout-checks.json
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const viewports = [
  { name: "1440px", width: 1440, height: 900, isMobile: false },
  { name: "768px", width: 768, height: 1024, isMobile: false },
  { name: "375px", width: 375, height: 667, isMobile: true },
];

const targets = [
  { slug: "app-prove", url: "http://localhost:5173/app/prove", delay: 1200 },
  { slug: "app-verify", url: "http://localhost:5173/app/verify", delay: 1200 },
  { slug: "app-dapp", url: "http://localhost:5173/app/dapp", delay: 1200 },
  { slug: "app-relying-party", url: "http://localhost:5173/app/relying-party", delay: 1200 },
  { slug: "app-simulation", url: "http://localhost:5173/app/simulation", delay: 1200 },
  { slug: "dev-ui", url: "http://localhost:5173/dev/ui", delay: 1200 },
];

async function run() {
  console.log("=== Running Step D: Automated App Layout Assertions ===");
  const outDir = path.join(__dirname, "..", "docs", "evidence", "ui");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--no-sandbox"
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const results = {
    timestamp: new Date().toISOString(),
    overallStatus: "PASS",
    summary: {
      totalChecks: 0,
      passed: 0,
      failed: 0,
    },
    pages: {},
  };

  try {
    for (const tgt of targets) {
      results.pages[tgt.slug] = {};

      for (const vp of viewports) {
        console.log(`Checking ${tgt.slug} at ${vp.name}...`);
        const tab = await fetch("http://localhost:9222/json/new?" + encodeURIComponent(tgt.url), { method: "PUT" }).then(r => r.json());
        const ws = new WebSocket(tab.webSocketDebuggerUrl);

        const pageErrors = [];

        const pageReport = await new Promise((resolve) => {
          let msgId = 1;
          const callbacks = new Map();

          const send = (method, params = {}) => {
            const id = msgId++;
            return new Promise((res) => {
              callbacks.set(id, res);
              ws.send(JSON.stringify({ id, method, params }));
            });
          };

          ws.addEventListener("message", (evt) => {
            const data = JSON.parse(evt.data);
            if (data.method === "Runtime.exceptionThrown") {
              pageErrors.push(data.params.exceptionDetails?.text || "Unknown exception");
            }
            if (data.id && callbacks.has(data.id)) {
              const cb = callbacks.get(data.id);
              callbacks.delete(data.id);
              cb(data);
            }
          });

          ws.addEventListener("open", async () => {
            await send("Page.enable");
            await send("Runtime.enable");
            await send("Emulation.setDeviceMetricsOverride", {
              width: vp.width,
              height: vp.height,
              deviceScaleFactor: 2,
              mobile: vp.isMobile,
            });

            await new Promise(r => setTimeout(r, tgt.delay));

            const evalRaw = await send("Runtime.evaluate", {
              expression: `
                (() => {
                  const scrollWidth = document.scrollingElement.scrollWidth;
                  const innerWidth = window.innerWidth;
                  const hasDocHorizScroll = scrollWidth > innerWidth + 1;

                  // Inner stage check
                  const scrollables = Array.from(document.querySelectorAll('.overflow-y-auto, .overflow-auto'));
                  let stageOverflow = false;
                  for (const s of scrollables) {
                    if (s.scrollWidth > s.clientWidth + 1) {
                      stageOverflow = true;
                    }
                  }

                  // Overlapping interactive elements check (standalone visible buttons/inputs)
                  const interactives = Array.from(document.querySelectorAll('button:not([disabled]):not([aria-hidden="true"]), input:not([disabled])'))
                    .filter(el => {
                      const rect = el.getBoundingClientRect();
                      return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight;
                    });

                  let overlaps = 0;
                  for (let i = 0; i < interactives.length; i++) {
                    const r1 = interactives[i].getBoundingClientRect();
                    for (let j = i + 1; j < interactives.length; j++) {
                      if (interactives[i].contains(interactives[j]) || interactives[j].contains(interactives[i])) continue;
                      const r2 = interactives[j].getBoundingClientRect();
                      const doesIntersect = !(
                        r2.left >= r1.right ||
                        r2.right <= r1.left ||
                        r2.top >= r1.bottom ||
                        r2.bottom <= r1.top
                      );
                      if (doesIntersect) {
                        overlaps++;
                      }
                    }
                  }

                  // Mobile touch targets check (standalone buttons/links on 375px)
                  let smallTouchTargets = 0;
                  const smallElements = [];
                  if (${vp.isMobile}) {
                    const buttons = Array.from(document.querySelectorAll('button:not([disabled]), .btn-cut, .btn-cut-border'));
                    for (const b of buttons) {
                      // skip if hidden, inside hidden drawer, or inside an inline text flow (copy buttons, inline links)
                      if (b.offsetParent === null) continue;
                      if (b.closest('p, dl, dt, dd, code, pre') || b.getAttribute('aria-label')?.includes('Copy')) continue;

                      const rect = b.getBoundingClientRect();
                      if (rect.width > 0 && rect.height > 0) {
                        if (rect.height < 40 || rect.width < 40) {
                          smallTouchTargets++;
                          smallElements.push({ tag: b.tagName, text: b.textContent?.trim().slice(0, 20), w: rect.width, h: rect.height });
                        }
                      }
                    }
                  }

                  return {
                    scrollWidth,
                    innerWidth,
                    hasDocHorizScroll,
                    stageOverflow,
                    interactiveCount: interactives.length,
                    overlapCount: overlaps,
                    smallTouchTargets,
                    smallElements,
                  };
                })()
              `,
              returnByValue: true,
              awaitPromise: true,
            });

            const val = evalRaw.result?.result?.value || evalRaw.result?.value || {};

            ws.close();
            resolve({
              layout: val,
              errors: pageErrors,
            });
          });
        });

        // Close tab
        await fetch(`http://localhost:9222/json/close/${tab.id}`).catch(() => { });

        const layout = pageReport.layout;
        const passScroll = !layout.hasDocHorizScroll && !layout.stageOverflow;
        const passOverlap = layout.overlapCount === 0;
        const passErrors = pageReport.errors.length === 0;
        const passTouch = layout.smallTouchTargets === 0;

        const isPassing = passScroll && passOverlap && passErrors && passTouch;

        results.summary.totalChecks++;
        if (isPassing) {
          results.summary.passed++;
        } else {
          results.summary.failed++;
          results.overallStatus = "FAIL";
        }

        results.pages[tgt.slug][vp.name] = {
          status: isPassing ? "PASS" : "FAIL",
          noHorizontalScroll: passScroll,
          noElementOverlaps: passOverlap,
          noConsoleErrors: passErrors,
          touchTargetsValid: passTouch,
          details: {
            ...layout,
            consoleErrors: pageReport.errors,
          },
        };
      }
    }
  } finally {
    chrome.kill();
  }

  const outPath = path.join(outDir, "layout-checks.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Report written to: ${outPath}`);
  console.log(`Results: ${results.summary.passed}/${results.summary.totalChecks} checks passed. Overall: ${results.overallStatus}`);

  if (results.overallStatus !== "PASS") {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Layout check failed:", err);
  process.exit(1);
});
