import express from "express";
import { execFile } from "node:child_process";

const app = express();
app.use(express.json({ limit: "1mb" }));

const APP_TOKEN = process.env.APP_TOKEN || "change-this-token";
const PORT = Number(process.env.PORT || 3000);

function runOpenClaw(message) {
  return new Promise((resolve, reject) => {
    execFile(
      "openclaw",
      ["agent", "--agent", "main", "--message", message],
      {
        timeout: 90_000,
        maxBuffer: 1024 * 1024,
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error((stderr || err.message || "unknown error").trim()));
          return;
        }
        resolve((stdout || "").trim());
      }
    );
  });
}

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.post("/chat", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (token !== APP_TOKEN) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const reply = await runOpenClaw(message);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message || "internal error" });
  }
});

app.listen(PORT, () => {
  console.log(`ios-openclaw-api listening on :${PORT}`);
});
