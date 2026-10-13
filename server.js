import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3e3;
const CONFIG_FILE = path.join(__dirname, "site-config.json");
app.use(express.json({ limit: "10mb" }));
function readConfigFile() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading site-config.json:", err);
  }
  return null;
}
app.get("/api/config", (_req, res) => {
  const config = readConfigFile();
  if (config) {
    res.json(config);
  } else {
    res.status(404).json({ error: "Config not found" });
  }
});
app.post("/api/config", (req, res) => {
  try {
    const { config, passcode } = req.body;
    if (passcode && passcode !== "abaidull77") {
      return res.status(403).json({ error: "Invalid passcode" });
    }
    if (!config || typeof config !== "object") {
      return res.status(400).json({ error: "Invalid config format" });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    console.log("Site configuration successfully saved to site-config.json");
    res.json({ success: true, message: "Configuration saved to server", config });
  } catch (err) {
    console.error("Error saving config to file:", err);
    res.status(500).json({ error: "Failed to write config", message: err?.message });
  }
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
        watch: process.env.DISABLE_HMR === "true" ? null : {}
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT} (isProd: ${isProd})`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
