const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const viewports = [
  { name: "1440px", width: 1440, height: 900, isMobile: false },
  { name: "768px", width: 768, height: 1024, isMobile: false },
  { name: "375px", width: 375, height: 667, isMobile: true },
];

const targets = [
  { slug: "landing", url: "http://127.0.0.1:5173/", delay: 1500 },
  { slug: "app-prove-idle", url: "http://127.0.0.1:5173/app/prove", delay: 1500 },
  { slug: "app-verify", url: "http://127.0.0.1:5173/app/verify", delay: 1500 },
  { slug: "app-verify-tx", url: "http://127.0.0.1:5173/app/verify/0x9b46ee740c0a9694ff24ec64152504b8686fdb2e5d99aa56b176d6ec5a64ceea", delay: 1500 },
  { slug: "app-dapp", url: "http://127.0.0.1:5173/app/dapp", delay: 1500 },
  { slug: "app-relying-party", url: "http://127.0.0.1:5173/app/relying-party", delay: 1500 },
  { slug: "dev-ui", url: "http://127.0.0.1:5173/dev/ui", delay: 1500 },
  { slug: "not-found", url: "http://127.0.0.1:5173/404-test", delay: 1200 },
];

async function run() {
  console.log("=== Capturing High-Fidelity UI Redesign Screenshots ===");
  const outDir = path.join(__dirname, "..", "docs", "evidence", "ui", "redesign");
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

        const tab = await fetch("http://127.0.0.1:9222/json/new?" + encodeURIComponent(tgt.url), { method: "PUT" }).then(r => r.json());
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
        await fetch(`http://127.0.0.1:9222/json/close/${tab.id}`).catch(() => { });
      }
    }
  } finally {
    chrome.kill();
  }
  console.log("=== All Redesign Screenshots Successfully Captured ===");
}

run().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
