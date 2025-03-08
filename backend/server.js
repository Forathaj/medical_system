/** @format */

import http from "http";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { authRoutes } from "./routes/authRoutes.js";
import { appointmentRoutes } from "./routes/appointmentRoutes.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chatgptAi } from "./routes/chatRoutes.js";

dotenv.config();
const PORT = process.env.PORT || 5000;
console.log("JWT Secret from .env:", process.env.JWT_SECRET); // Debugging line

const client = new MongoClient("mongodb://localhost:27017/medicalDB");
await client.connect();
console.log("✅ Connected to MongoDB");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/auth")) {
    authRoutes(req, res, client);
  } else if (req.url.startsWith("/appointments")) {
    appointmentRoutes(req, res, client);
  } else if (req.url.startsWith("/ai/symptom-checker")) {
    chatgptAi(req, res);
  } else {
    // Serve frontend files
    let filePath = path.join(
      __dirname,
      "../frontend",
      req.url === "/" ? "login.html" : req.url
    );
    let extname = path.extname(filePath);
    let contentType = "text/html";

    switch (extname) {
      case ".css":
        contentType = "text/css";
        break;
      case ".js":
        contentType = "application/javascript";
        break;
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404: File Not Found");
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. Trying a different port...`
    );
    server.listen(PORT + 1, () => {
      console.log(`✅ Server running at http://localhost:${PORT + 1}`);
    });
  } else {
    console.error("❌ Server error:", err);
  }
});
