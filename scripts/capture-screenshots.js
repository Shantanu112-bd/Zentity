const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const viewports = [
  { name: "375px", width: 375, height: 667, isMobile: true },
  { name: "768px", width: 768, height: 1024, isMobile: false },
  { name: "1440px", width: 1440, height: 900, isMobile: false },
];

const chapters = ["credential", "proof", "verified"];

async function run() {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--no-sandbox"
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    for (const vp of viewports) {
      for (const ch of chapters) {
        const url = `http://127.0.0.1:4173/?chapter=${ch}&skipPreloader=true`;
        console.log(`Capturing ${ch} at ${vp.name}...`);

        const tab = await fetch("http://127.0.0.1:9222/json/new?" + encodeURIComponent(url), { method: "PUT" }).then(r => r.json());
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

            // Wait 2.4s for procedural canvas scene and styling animations to fully settle
            await new Promise(r => setTimeout(r, 2400));

            const shotId = send("Page.captureScreenshot", {
              format: "png",
              captureBeyondViewport: false,
            });

            const onMsg = (event) => {
              const data = JSON.parse(event.data);
              if (data.id === shotId) {
                const base64Data = data.result.data;
                const outPath = path.join(__dirname, "..", "docs", "evidence", "ui", `chapter-${ch}-${vp.name}.png`);
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
        await fetch(`http://127.0.0.1:9222/json/close/${tab.id}`).catch(() => {});
      }
    }
  } finally {
    chrome.kill();
  }
}

run().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
