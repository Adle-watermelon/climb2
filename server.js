const express = require('express');
const { createServer } = require('http');

const app = express();
const port = process.env.PORT || 4000; // Render推奨: PORT環境変数を使う

app.use(express.static(__dirname + '/client'));

// テスト用ルート
app.get("/", (req, res) => {
  res.send("Hello from Render! 🚀");
});

const staticServer = createServer(app);
staticServer.listen(port, "0.0.0.0", () => {
  console.log(`Static server running on port ${port}`);
});
