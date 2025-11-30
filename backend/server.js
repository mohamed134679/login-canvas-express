import express from "express";
import * as db from "./db.js";

const app = express();

app.get("/test-db", async (req, res) => {
  try {
    await db.connectDB();
    res.json({ success: true, message: "✅ Database connected successfully!" });
  } catch (error) {
    console.error("DB Connection Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// In server.js, add this:
app.get("/", (req, res) => {
  res.send("Welcome to the backend server!");
});

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || "127.0.0.1";

app.listen(PORT, HOST, () => {
  console.log(`✅ Backend running on http://${HOST}:${PORT}`);
});
