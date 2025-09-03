// server.js
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000; // Renderの環境変数を使う

// client フォルダを静的ファイルとして公開
app.use(express.static(path.join(__dirname, "client")));

// テスト用ルート
app.get("/", (req, res) => {
  res.send("Hello from Render with import/export 🚀");
});

const staticServer = createServer(app);
staticServer.listen(port, "0.0.0.0", () => {
  console.log(`Static server running on port ${port}`);
});
