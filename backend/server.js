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

app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});
