const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const viewports = [
  { name: "1440px", width: 1440, height: 900, isMobile: false },
  { name: "768px", width: 768, height: 1024, isMobile: false },
  { name: "375px", width: 375, height: 667, isMobile: true },
];

const targets = [
  { slug: "app-prove", url: "http://localhost:5173/app/prove", delay: 1500 },
  { slug: "app-verify", url: "http://localhost:5173/app/verify", delay: 1500 },
  { slug: "app-dapp", url: "http://localhost:5173/app/dapp", delay: 1500 },
  { slug: "app-relying-party", url: "http://localhost:5173/app/relying-party", delay: 1500 },
];

async function run() {
  console.log("=== Capturing BEFORE Screenshots for UI Refinement ===");
  const outDir = path.join(__dirname, "..", "docs", "evidence", "ui", "app-before");
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

  try {
    for (const vp of viewports) {
      for (const tgt of targets) {
        console.log(`Capturing ${tgt.slug} at ${vp.name}...`);

        const tab = await fetch("http://localhost:9222/json/new?" + encodeURIComponent(tgt.url), { method: "PUT" }).then(r => r.json());
        const ws = new WebSocket(tab.webSocketDebuggerUrl);

        await new Promise((resolve) => {
          let msgId = 1;
          const send = (method, params = {}) => {
            const id = msgId++;
            ws.send(JSON.stringify({ id, method, params }));
            return id;
          };

          ws.addEventListener("open", async () => {
            send("Page.enable");
            send("Emulation.setDeviceMetricsOverride", {
              width: vp.width,
              height: vp.height,
              deviceScaleFactor: 2,
              mobile: vp.isMobile,
            });

            await new Promise(r => setTimeout(r, tgt.delay));

            const shotId = send("Page.captureScreenshot", {
              format: "png",
              captureBeyondViewport: false,
            });

            const onMsg = (event) => {
              const data = JSON.parse(event.data);
              if (data.id === shotId) {
                const base64Data = data.result.data;
                const outPath = path.join(outDir, `${tgt.slug}-${vp.name}.png`);
                fs.writeFileSync(outPath, Buffer.from(base64Data, "base64"));
                console.log(`Saved: ${outPath} (${Buffer.from(base64Data, "base64").length} bytes)`);
                ws.removeEventListener("message", onMsg);
                ws.close();
                resolve();
              }
            };
            ws.addEventListener("message", onMsg);
          });
        });

        // Close tab
        await fetch(`http://localhost:9222/json/close/${tab.id}`).catch(() => { });
      }
    }
  } finally {
    chrome.kill();
  }
  console.log("=== All BEFORE Screenshots Successfully Captured ===");
}

run().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});

